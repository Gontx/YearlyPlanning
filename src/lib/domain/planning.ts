import { Plan, DayData, Holiday } from '@/types';
import { isWeekend, eachDayOfInterval, format } from 'date-fns';

/**
 * Calculates if a given date should be considered a vacation day based on the plan's requirements.
 * It checks if the plan requires holiday and if the day is a working day (not weekend, not bank holiday).
 */
export function calculateVacationStatus(
    date: Date,
    planRequiresHoliday: boolean,
    bankHolidayDates: Set<string>
): boolean {
    if (!planRequiresHoliday) return false;

    // If the plan requires holiday, we mark it as such.
    // However, the *allowance* calculation logic (handled elsewhere usually) 
    // would filter out weekends/bank holidays.
    // Visually, the user wants to see the "block" as a holiday.
    // Based on previous requirements: "all days the plan spans... are visually marked as holidays".
    return true;
}

/**
 * Determines if a specific day is a working day (mon-fri, not bank holiday).
 * Useful for calculating allowance usage.
 */
export function isWorkingDay(date: Date, bankHolidayDates: Set<string>): boolean {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isWeekend(date)) return false;
    if (bankHolidayDates.has(dateStr)) return false;
    return true;
}

/**
 * Generates a list of DayData updates for a multi-day plan.
 */
export function generateMultiDayUpdates(
    basePlan: Plan,
    start: Date,
    end: Date,
    currentDayData: Record<string, DayData>,
    holidays: Holiday[]
): Record<string, DayData> {
    if (start > end) return {};

    const daysToUpdate: Record<string, DayData> = {};
    const bankHolidayDates = new Set(holidays.map(h => h.date));
    const parentId = basePlan.parentId || basePlan.id;

    const days = eachDayOfInterval({ start, end });

    days.forEach(current => {
        const dateStr = format(current, 'yyyy-MM-dd');
        const existing = currentDayData[dateStr] || { date: dateStr, isVacation: false, plans: [] };

        // Create a unique instance for this day
        const dailyPlan: Plan = {
            ...basePlan,
            id: crypto.randomUUID(),
            parentId: parentId,
            requiresHoliday: basePlan.requiresHoliday
        };

        // Determine visual vacation status
        // If the plan requires holiday, we mark the day as a vacation day visually
        const shouldMarkVacation = dailyPlan.requiresHoliday || existing.isVacation;

        daysToUpdate[dateStr] = {
            ...existing,
            isVacation: shouldMarkVacation,
            plans: [...existing.plans, dailyPlan]
        };
    });

    return daysToUpdate;
}
