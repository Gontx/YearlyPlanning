'use client';

import { useUIStore } from "@/lib/store/useUIStore";
import { useDataStore } from "@/lib/store/useDataStore";
import { MonthCard } from "./MonthCard";
import { useEffect } from "react";
import { DayDetailsDrawer } from "./DayDetailsDrawer"; // We will create this next
import { format } from "date-fns";


export function YearGrid() {
    const currentYear = useUIStore(state => state.currentYear);
    const openDrawer = useUIStore(state => state.openDrawer);
    const loadData = useDataStore(state => state.loadData);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDayClick = (date: Date) => {
        // Format as YYYY-MM-DD for store (use local time via date-fns format)
        const dateStr = format(date, 'yyyy-MM-dd');
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

            <DayDetailsDrawer />
        </div>
    );
}
