import { DayData, Plan, Holiday, HolidaySettings } from "@/types";

// --- Repository Interface ---

export interface IYearPlannerRepository {
    // Day Data (Plans + Vacation status)
    getDayData(date: string): Promise<DayData | null>;
    saveDayData(dayData: DayData): Promise<void>;
    getAllDayData(): Promise<Record<string, DayData>>; // key: YYYY-MM-DD
    getSettings(): Promise<HolidaySettings | null>;
    saveSettings(settings: HolidaySettings): Promise<void>;

    // Plans (Specific operations if needed, but saveDayData covers it usually)
    // For searching
    searchPlans(query: string): Promise<Plan[]>;
}

// --- LocalStorage Implementation ---

const STORAGE_KEY = 'year_planner_data_v1';

export class LocalStorageRepository implements IYearPlannerRepository {
    private getStorage(): Record<string, DayData> {
        if (typeof window === 'undefined') return {};
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error("Failed to parse planner data", e);
            return {};
        }
    }

    private setStorage(data: Record<string, DayData>) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    async getDayData(date: string): Promise<DayData | null> {
        const all = this.getStorage();
        return all[date] || null;
    }

    async saveDayData(dayData: DayData): Promise<void> {
        const all = this.getStorage();
        all[dayData.date] = dayData;
        this.setStorage(all);
    }

    async getAllDayData(): Promise<Record<string, DayData>> {
        return this.getStorage();
    }

    async getSettings(): Promise<HolidaySettings | null> {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(STORAGE_KEY + '_settings');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error("Failed to parse settings", e);
            return null;
        }
    }

    async saveSettings(settings: HolidaySettings): Promise<void> {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(settings));
    }

    async searchPlans(query: string): Promise<Plan[]> {
        const all = this.getStorage();
        const queryLower = query.toLowerCase();
        const results: Plan[] = [];

        Object.values(all).forEach(day => {
            day.plans.forEach(plan => {
                if (
                    plan.title.toLowerCase().includes(queryLower) ||
                    plan.notes?.toLowerCase().includes(queryLower) ||
                    plan.tag.toLowerCase().includes(queryLower)
                ) {
                    results.push(plan);
                }
            });
        });

        return results;
    }
}

export const repository = new LocalStorageRepository();
