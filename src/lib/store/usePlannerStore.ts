import { create } from 'zustand';
import { DayData, Holiday, Plan, HolidaySettings } from '@/types';
import { getRepository } from '@/components/Providers';
import { SPANISH_HOLIDAYS } from '@/data/holidays';
import { getYear } from 'date-fns';

interface PlannerState {
    // UI State
    currentYear: number;
    showWeekends: boolean;
    showBankHolidays: boolean;
    searchQuery: string;
    selectedRegion: string;

    // Data State
    holidays: Holiday[];
    dayData: Record<string, DayData>; // Map date (YYYY-MM-DD) -> DayData
    holidaySettings: HolidaySettings;

    // Actions
    setYear: (year: number) => void;
    toggleWeekends: () => void;
    toggleBankHolidays: () => void;
    setSearchQuery: (query: string) => void;
    updateHolidaySettings: (settings: HolidaySettings) => void;

    // Data Operations
    loadData: () => Promise<void>;
    toggleVacation: (date: string) => Promise<void>;
    addPlan: (date: string, plan: Plan) => Promise<void>;
    addMultiDayPlan: (startDate: string, endDate: string, plan: Plan) => Promise<void>;
    updatePlan: (date: string, plan: Plan) => Promise<void>;
    removePlan: (date: string, planId: string) => Promise<void>;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
    currentYear: getYear(new Date()),
    showWeekends: true,
    showBankHolidays: true,
    searchQuery: '',
    selectedRegion: 'ES',
    holidays: SPANISH_HOLIDAYS, // Initialize with seed data
    dayData: {},
    holidaySettings: {
        baseAllowance: 23,
        rolloverDays: 0,
        rolloverExpiryDate: `${getYear(new Date())}-06-30`
    },

    setYear: (year) => set({ currentYear: year }),
    toggleWeekends: () => set((state) => ({ showWeekends: !state.showWeekends })),
    toggleBankHolidays: () => set((state) => ({ showBankHolidays: !state.showBankHolidays })),
    setSearchQuery: (query) => set({ searchQuery: query }),
    updateHolidaySettings: async (settings) => {
        set({ holidaySettings: settings });
        await getRepository().saveSettings(settings);
    },

    loadData: async () => {
        const data = await getRepository().getAllDayData();
        const settings = await getRepository().getSettings();

        set((state) => ({
            dayData: data,
            holidaySettings: settings || state.holidaySettings
        }));
    },

    toggleVacation: async (date) => {
        const currentData = get().dayData[date] || { date, isVacation: false, plans: [] };
        const newData = { ...currentData, isVacation: !currentData.isVacation };

        // Optimistic update
        set((state) => ({
            dayData: { ...state.dayData, [date]: newData }
        }));

        await getRepository().saveDayData(newData);
    },

    addPlan: async (date, plan) => {
        const currentData = get().dayData[date] || { date, isVacation: false, plans: [] };
        const newData = {
            ...currentData,
            plans: [...currentData.plans, plan]
        };

        set((state) => ({
            dayData: { ...state.dayData, [date]: newData }
        }));

        await getRepository().saveDayData(newData);
    },

    addMultiDayPlan: async (startDateStr, endDateStr, basePlan) => {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        // Prevent infinite loop if dates are wrong
        if (start > end) return;

        const daysToUpdate: Record<string, DayData> = {};
        const currentDayData = get().dayData;

        // Generate a shared parent ID if none exists
        const parentId = basePlan.parentId || basePlan.id;

        // Iterate from start to end
        let current = start;
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const existing = currentDayData[dateStr] || { date: dateStr, isVacation: false, plans: [] };

            // Create a plan copy for this day
            // We give it a unique ID for the day, but link it via parentId
            const dailyPlan: Plan = {
                ...basePlan,
                id: crypto.randomUUID(), // New unique ID for this instance
                parentId: parentId
            };

            daysToUpdate[dateStr] = {
                ...existing,
                plans: [...existing.plans, dailyPlan]
            };

            current.setDate(current.getDate() + 1);
        }

        // Batch update state
        set((state) => ({
            dayData: { ...state.dayData, ...daysToUpdate }
        }));

        // Batch update persistence (sequentially for now, could be improved)
        for (const day of Object.values(daysToUpdate)) {
            await getRepository().saveDayData(day);
        }
    },

    updatePlan: async (date, updatedPlan) => {
        const currentData = get().dayData[date];
        if (!currentData) return;

        const newData = {
            ...currentData,
            plans: currentData.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
        };

        set((state) => ({
            dayData: { ...state.dayData, [date]: newData }
        }));

        await getRepository().saveDayData(newData);
    },

    removePlan: async (date, planId) => {
        const currentData = get().dayData[date];
        if (!currentData) return;

        const newData = {
            ...currentData,
            plans: currentData.plans.filter(p => p.id !== planId)
        };

        set((state) => ({
            dayData: { ...state.dayData, [date]: newData }
        }));

        await getRepository().saveDayData(newData);
    }
}));
