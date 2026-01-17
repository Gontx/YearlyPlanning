'use client';

import { usePlannerStore } from "@/lib/store/usePlannerStore";
import { MonthCard } from "./MonthCard";
import { useEffect } from "react";
import { DayDetailsDrawer } from "./DayDetailsDrawer"; // We will create this next


export function YearGrid() {
    const currentYear = usePlannerStore(state => state.currentYear);
    const loadData = usePlannerStore(state => state.loadData);

    // UI State from store
    const selectedDateStr = usePlannerStore(state => state.selectedDate);
    const isDrawerOpen = usePlannerStore(state => state.isDrawerOpen);
    const openDrawer = usePlannerStore(state => state.openDrawer);
    const closeDrawer = usePlannerStore(state => state.closeDrawer);

    // Convert string date back to Date object for the drawer prop
    const selectedDate = selectedDateStr ? new Date(selectedDateStr) : null;

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDayClick = (date: Date) => {
        // Format as YYYY-MM-DD for store
        const dateStr = date.toISOString().split('T')[0];
        openDrawer(dateStr);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 12 }).map((_, i) => (
                    <MonthCard
                        key={`${currentYear}-${i}`}
                        year={currentYear}
                        monthIndex={i}
                        onDayClick={handleDayClick}
                    />
                ))}
            </div>

            <DayDetailsDrawer
                open={isDrawerOpen}
                onOpenChange={(open) => !open && closeDrawer()}
                date={selectedDate}
            />
        </div>
    );
}
