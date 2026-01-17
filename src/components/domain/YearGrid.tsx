'use client';

import { usePlannerStore } from "@/lib/store/usePlannerStore";
import { MonthCard } from "./MonthCard";
import { useEffect } from "react";
import { DayDetailsDrawer } from "./DayDetailsDrawer"; // We will create this next
import { useState } from "react";

export function YearGrid() {
    const currentYear = usePlannerStore(state => state.currentYear);
    const loadData = usePlannerStore(state => state.loadData);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsDrawerOpen(true);
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
                onOpenChange={setIsDrawerOpen}
                date={selectedDate}
            />
        </div>
    );
}
