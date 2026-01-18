import { create } from 'zustand';
import { DayData, Holiday, Plan, HolidaySettings } from '@/types';
import { getRepository } from '@/components/Providers';
import { SPANISH_HOLIDAYS } from '@/data/holidays';
import { getYear, isWeekend } from 'date-fns';

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

    // UI Navigation State
    isDrawerOpen: boolean;
    selectedDate: string | null; // YYYY-MM-DD

    // Actions
    setYear: (year: number) => void;
    toggleWeekends: () => void;
    toggleBankHolidays: () => void;
    setSearchQuery: (query: string) => void;
    updateHolidaySettings: (settings: HolidaySettings) => void;

    // Navigation Actions
    openDrawer: (date: string) => void;
    closeDrawer: () => void;

    // Data Operations
    loadData: () => Promise<void>;
    toggleVacation: (date: string) => Promise<void>;
    addPlan: (date: string, plan: Plan) => Promise<void>;
    addMultiDayPlan: (startDate: string, endDate: string, plan: Plan, markAsVacation?: boolean) => Promise<void>;
    updatePlan: (date: string, plan: Plan) => Promise<void>;
    removePlan: (date: string, planId: string) => Promise<void>;
    getPlanRange: (plan: Plan) => { startDate: string, endDate: string };
    editPlan: (originalPlan: Plan, newStart: string, newEnd: string, newPlanData: Plan, isVacation: boolean) => Promise<void>;
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

    // UI Navigation Init
    isDrawerOpen: false,
    selectedDate: null,

    setYear: (year) => set({ currentYear: year }),
    toggleWeekends: () => set((state) => ({ showWeekends: !state.showWeekends })),
    toggleBankHolidays: () => set((state) => ({ showBankHolidays: !state.showBankHolidays })),
    setSearchQuery: (query) => set({ searchQuery: query }),
    updateHolidaySettings: async (settings) => {
        set({ holidaySettings: settings });
        await getRepository().saveSettings(settings);
    },

    openDrawer: (date) => set({ isDrawerOpen: true, selectedDate: date }),
    closeDrawer: () => set({ isDrawerOpen: false, selectedDate: null }),

    loadData: async () => {
        const data = await getRepository().getAllDayData();
        const settings = await getRepository().getSettings();

        // Calculate vacation status for all loaded days (migration/safeguard)
        const holidays = get().holidays;
        const bankHolidayDates = new Set(holidays.map(h => h.date));

        const validatedData: Record<string, DayData> = {};

        Object.values(data).forEach(day => {
            // Determine if vacation based on plans
            // Updated: Include weekends/bank holidays if plan requires it
            const shouldBeVacation = day.plans.some(p => p.requiresHoliday);

            validatedData[day.date] = {
                ...day,
                isVacation: shouldBeVacation
            };
        });

        set((state) => ({
            dayData: validatedData,
            holidaySettings: settings || state.holidaySettings
        }));
    },

    toggleVacation: async (date) => {
        // Deprecated: No-op or throw?
        // For backwards compatibility or if UI calls it mismatch, we will remove this UI control.
        console.warn("toggleVacation is deprecated. Use plan.requiresHoliday instead.");
    },

    addPlan: async (date, plan) => {
        const currentData = get().dayData[date] || { date, isVacation: false, plans: [] };

        // Recalculate vacation status
        const holidays = get().holidays;
        const bankHolidayDates = new Set(holidays.map(h => h.date));
        const isWeekendDay = isWeekend(new Date(date));
        const isBankHoliday = bankHolidayDates.has(date);

        const newPlans = [...currentData.plans, plan];

        // Updated: Include weekends/bank holidays if plan requires it
        const shouldBeVacation = newPlans.some(p => p.requiresHoliday);

        const newData = {
            ...currentData,
            plans: newPlans,
            isVacation: shouldBeVacation
        };

        set((state) => ({
            dayData: { ...state.dayData, [date]: newData }
        }));

        await getRepository().saveDayData(newData);
    },

    addMultiDayPlan: async (startDateStr, endDateStr, basePlan, markAsVacation = false) => {
        // Parse dates as local dates (avoid timezone issues with new Date(string))
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);

        // Prevent infinite loop if dates are wrong
        if (start > end) return;

        const daysToUpdate: Record<string, DayData> = {};
        const currentDayData = get().dayData;
        const holidays = get().holidays;

        // Create a set of bank holiday dates for quick lookup
        const bankHolidayDates = new Set(holidays.map(h => h.date));

        // Generate a shared parent ID if none exists
        const parentId = basePlan.parentId || basePlan.id;

        // Iterate from start to end
        let current = new Date(start);
        while (current <= end) {
            // Format date as YYYY-MM-DD in local timezone
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const existing = currentDayData[dateStr] || { date: dateStr, isVacation: false, plans: [] };
            const isBankHoliday = bankHolidayDates.has(dateStr);
            const isWeekendDay = isWeekend(current);

            // Create a plan copy for this day
            // We give it a unique ID for the day, but link it via parentId
            const dailyPlan: Plan = {
                ...basePlan,
                id: crypto.randomUUID(), // New unique ID for this instance
                parentId: parentId,
                // Ensure requiresHoliday is consistent.
                // Note: The UI might pass markAsVacation, but now we should rely on basePlan.requiresHoliday
                // If basePlan.requiresHoliday is set, we use it.
                // If the param `markAsVacation` passed from legacy calls is true, we should enforce it?
                // The new UI will pass basePlan with requiresHoliday set.
                // Let's ensure basePlan takes precedence or syncs.
                requiresHoliday: basePlan.requiresHoliday
            };

            // If legacy call passes markAsVacation=true but plan says false...
            // We'll trust properties on the plan object primarily now.
            if (markAsVacation && dailyPlan.requiresHoliday === undefined) {
                dailyPlan.requiresHoliday = true;
            }

            // Determine if we should mark this day as vacation
            // Updated: Include weekends/bank holidays if plan requires it
            const shouldMarkVacation = (markAsVacation || dailyPlan.requiresHoliday) ?? false;

            daysToUpdate[dateStr] = {
                ...existing,
                isVacation: shouldMarkVacation ? true : existing.isVacation,
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

        const newPlans = currentData.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);

        // Recalculate calc
        // Updated: Include weekends/bank holidays if plan requires it
        const shouldBeVacation = newPlans.some(p => p.requiresHoliday);

        const newData = {
            ...currentData,
            plans: newPlans,
            isVacation: shouldBeVacation
        };

        set((state) => ({
            dayData: { ...state.dayData, [date]: newData }
        }));

        await getRepository().saveDayData(newData);
    },

    removePlan: async (date, planId) => {
        const currentData = get().dayData[date];
        if (!currentData) return;

        const planToRemove = currentData.plans.find(p => p.id === planId);
        if (!planToRemove) return;

        const daysToUpdate: Record<string, DayData> = {};
        const currentDayData = get().dayData;
        const holidays = get().holidays;
        const bankHolidayDates = new Set(holidays.map(h => h.date));

        // If it's a multi-day plan (has parentId), we need to find all related plans
        if (planToRemove.parentId) {
            // Iterate through all days to find instances of this plan hierarchy
            // Note: In a production app with DB, this would be a simple query. 
            // Here we iterate in memory. Optimization: Search only near the original date? 
            // For now, full implementation for correctness:
            Object.values(currentDayData).forEach(day => {
                const multiDayInstance = day.plans.find(p => p.parentId === planToRemove.parentId);
                if (multiDayInstance) {
                    const newPlans = day.plans.filter(p => p.parentId !== planToRemove.parentId);

                    // Recalculate vacation status
                    // Updated: Include weekends/bank holidays if plan requires it
                    const shouldBeVacation = newPlans.some(p => p.requiresHoliday);

                    daysToUpdate[day.date] = {
                        ...day,
                        isVacation: shouldBeVacation,
                        plans: newPlans
                    };
                }
            });
        } else {
            // Single plan removal
            const newPlans = currentData.plans.filter(p => p.id !== planId);

            // Recalculate
            // Updated: Include weekends/bank holidays if plan requires it
            const shouldBeVacation = newPlans.some(p => p.requiresHoliday);

            daysToUpdate[date] = {
                ...currentData,
                isVacation: shouldBeVacation,
                plans: newPlans
            };
        }

        set((state) => ({
            dayData: { ...state.dayData, ...daysToUpdate }
        }));

        for (const day of Object.values(daysToUpdate)) {
            await getRepository().saveDayData(day);
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

    editPlan: async (originalPlan, newStart, newEnd, newPlanData, isVacation) => {
        // 1. Remove the old plan (using any date it was present in, we can find it via parentId)
        // We need a date to call removePlan.
        const range = get().getPlanRange(originalPlan);
        if (range.startDate) {
            await get().removePlan(range.startDate, originalPlan.id);
        } else {
            // Fallback if not found (shouldn't happen)
            return;
        }

        // 2. Add the new plan
        // Ensure newPlanData has the same parentId structure if it was multi-day, 
        // OR if we are effectively creating a new multi-day plan, we might generate a new ID.
        // Actually, to keep it clean, let's treat it as a new insertion.
        // But if we want to preserve the "identity" (UUID) of the plan... 
        // The addMultiDayPlan generates NEW ids for each day instance, but uses a shared parentId.
        // We should reuse the original parentId if possible, or newPlanData's ID.

        const planToAdd = {
            ...newPlanData,
            id: crypto.randomUUID(), // New base ID
            parentId: originalPlan.parentId || originalPlan.id, // Propagate the original grouping ID
            // Ensure requiresHoliday is set
            requiresHoliday: newPlanData.requiresHoliday
        };

        // Data sanitization: requiresHoliday is now intrinsic to the plan, so the `isVacation` arg is actually redundant 
        // if we trust newPlanData, but let's ensure consistency.

        // Resetting parentId to ensure fresh start for the new range
        planToAdd.parentId = planToAdd.id;

        await get().addMultiDayPlan(newStart, newEnd, planToAdd, newPlanData.requiresHoliday);
    }
}));
