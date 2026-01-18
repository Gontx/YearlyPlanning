import { create } from 'zustand';
import { DayData, Holiday, Plan, HolidaySettings } from '@/types';
import { getRepository } from '@/components/Providers';
import { SPANISH_HOLIDAYS } from '@/data/holidays';
import { getYear } from 'date-fns';
import { generateMultiDayUpdates } from '@/lib/domain/planning';
import { toast } from 'sonner';

interface DataState {
    // State
    holidays: Holiday[];
    dayData: Record<string, DayData>; // Map date (YYYY-MM-DD) -> DayData
    holidaySettings: HolidaySettings;

    // Actions
    loadData: () => Promise<void>;
    updateHolidaySettings: (settings: HolidaySettings) => Promise<void>;
    addPlan: (date: string, plan: Plan) => Promise<void>;
    addMultiDayPlan: (startDate: string, endDate: string, plan: Plan) => Promise<void>;
    updatePlan: (date: string, plan: Plan) => Promise<void>;
    removePlan: (date: string, planId: string) => Promise<void>;
    getPlanRange: (plan: Plan) => { startDate: string, endDate: string };
    editPlan: (originalPlan: Plan, newStart: string, newEnd: string, newPlanData: Plan) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
    holidays: SPANISH_HOLIDAYS, // Initialize with seed data
    dayData: {},
    holidaySettings: {
        baseAllowance: 23,
        rolloverDays: 0,
        rolloverExpiryDate: `${getYear(new Date())}-06-30`
    },

    loadData: async () => {
        try {
            const data = await getRepository().getAllDayData();
            const settings = await getRepository().getSettings();

            // Simple validation/migration pass could go here if needed
            // For now, we trust the repo or existing logic

            set((state) => ({
                dayData: data,
                holidaySettings: settings || state.holidaySettings
            }));
        } catch (error) {
            console.error("Failed to load data", error);
        }
    },

    updateHolidaySettings: async (settings) => {
        set({ holidaySettings: settings });
        await getRepository().saveSettings(settings);
    },



    addPlan: async (date, plan) => {
        const previousData = get().dayData; // Snapshot for rollback
        try {
            const currentData = get().dayData[date] || { date, isVacation: false, plans: [] };
            const newPlans = [...currentData.plans, plan];
            const shouldBeVacation = newPlans.some(p => p.requiresHoliday);
            const newData = { ...currentData, plans: newPlans, isVacation: shouldBeVacation };

            set((state) => ({
                dayData: { ...state.dayData, [date]: newData }
            }));

            await getRepository().saveDayData(newData);
            toast.success("Plan added successfully");
        } catch (error) {
            console.error("Failed to add plan", error);
            set({ dayData: previousData }); // Rollback
            toast.error("Failed to add plan. Please try again.");
        }
    },

    addMultiDayPlan: async (startDate: string, endDate: string, plan: Plan) => {
        const previousData = get().dayData;
        try {
            const updates = generateMultiDayUpdates(
                plan,
                new Date(startDate),
                new Date(endDate),
                get().dayData,
                get().holidays
            );

            set((state) => ({
                dayData: { ...state.dayData, ...updates }
            }));

            // Ideally batch save
            for (const day of Object.values(updates)) {
                await getRepository().saveDayData(day);
            }
            toast.success("Multi-day plan added");
        } catch (error) {
            console.error("Failed to add multi-day plan", error);
            set({ dayData: previousData });
            toast.error("Failed to add multi-day plan.");
        }
    },

    updatePlan: async (date, updatedPlan) => {
        const previousData = get().dayData;
        try {
            const currentData = get().dayData[date];
            if (!currentData) return;

            const newPlans = currentData.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
            const shouldBeVacation = newPlans.some(p => p.requiresHoliday);
            const newData = { ...currentData, plans: newPlans, isVacation: shouldBeVacation };

            set((state) => ({
                dayData: { ...state.dayData, [date]: newData }
            }));

            await getRepository().saveDayData(newData);
            toast.success("Plan updated");
        } catch (error) {
            console.error("Failed to update plan", error);
            set({ dayData: previousData });
            toast.error("Failed to update plan.");
        }
    },

    removePlan: async (date, planId) => {
        const previousData = get().dayData;
        try {
            const currentData = get().dayData[date];
            if (!currentData) return;

            const planToRemove = currentData.plans.find(p => p.id === planId);
            if (!planToRemove) return;

            const daysToUpdate: Record<string, DayData> = {};
            const currentDayData = get().dayData;

            if (planToRemove.parentId) {
                Object.values(currentDayData).forEach(day => {
                    const multiDayInstance = day.plans.find(p => p.parentId === planToRemove.parentId);
                    if (multiDayInstance) {
                        const newPlans = day.plans.filter(p => p.parentId !== planToRemove.parentId);
                        const shouldBeVacation = newPlans.some(p => p.requiresHoliday);
                        daysToUpdate[day.date] = { ...day, isVacation: shouldBeVacation, plans: newPlans };
                    }
                });
            } else {
                const newPlans = currentData.plans.filter(p => p.id !== planId);
                const shouldBeVacation = newPlans.some(p => p.requiresHoliday);
                daysToUpdate[date] = { ...currentData, isVacation: shouldBeVacation, plans: newPlans };
            }

            set((state) => ({
                dayData: { ...state.dayData, ...daysToUpdate }
            }));

            for (const day of Object.values(daysToUpdate)) {
                await getRepository().saveDayData(day);
            }
            toast.success("Plan removed");
        } catch (error) {
            console.error("Failed to remove plan", error);
            set({ dayData: previousData });
            toast.error("Failed to remove plan.");
        }
    },

    getPlanRange: (plan) => {
        const idToSearch = plan.parentId || plan.id;
        const allDays = get().dayData;
        const dates: string[] = [];

        Object.values(allDays).forEach(day => {
            if (day.plans.some(p => p.id === idToSearch || p.parentId === idToSearch)) {
                dates.push(day.date);
            }
        });

        if (dates.length === 0) return { startDate: '', endDate: '' };
        dates.sort();
        return { startDate: dates[0], endDate: dates[dates.length - 1] };
    },

    editPlan: async (originalPlan, newStart, newEnd, newPlanData) => {
        const range = get().getPlanRange(originalPlan);
        if (range.startDate) {
            await get().removePlan(range.startDate, originalPlan.id);
        }

        const planToAdd = {
            ...newPlanData,
            id: crypto.randomUUID(),
            parentId: originalPlan.parentId || originalPlan.id,
            requiresHoliday: newPlanData.requiresHoliday
        };

        // Resetting parentId to ensure fresh ID if needed, or keeping it?
        // Logic from previous store:
        planToAdd.parentId = planToAdd.id;

        // If simple single day logic check:
        if (newStart === newEnd) {
            await get().addPlan(newStart, planToAdd);
        } else {
            await get().addMultiDayPlan(newStart, newEnd, planToAdd);
        }
    }
}));
