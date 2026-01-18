import { create } from 'zustand';
import { getYear } from 'date-fns';

interface UIState {
    // State
    currentYear: number;
    showWeekends: boolean;
    showBankHolidays: boolean;
    searchQuery: string;
    selectedRegion: string;
    isDrawerOpen: boolean;
    selectedDate: string | null; // YYYY-MM-DD

    // Actions
    setYear: (year: number) => void;
    toggleWeekends: () => void;
    toggleBankHolidays: () => void;
    setSearchQuery: (query: string) => void;
    openDrawer: (date: string) => void;
    closeDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    currentYear: getYear(new Date()),
    showWeekends: true,
    showBankHolidays: true,
    searchQuery: '',
    selectedRegion: 'ES',
    isDrawerOpen: false,
    selectedDate: null,

    setYear: (year) => set({ currentYear: year }),
    toggleWeekends: () => set((state) => ({ showWeekends: !state.showWeekends })),
    toggleBankHolidays: () => set((state) => ({ showBankHolidays: !state.showBankHolidays })),
    setSearchQuery: (query) => set({ searchQuery: query }),
    openDrawer: (date) => set({ isDrawerOpen: true, selectedDate: date }),
    closeDrawer: () => set({ isDrawerOpen: false, selectedDate: null }),
}));
