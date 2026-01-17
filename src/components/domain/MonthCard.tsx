import { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, format, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { DayCell } from './DayCell';
import { usePlannerStore } from '@/lib/store/usePlannerStore';
import { motion } from 'framer-motion';

interface MonthCardProps {
    year: number;
    monthIndex: number; // 0-11
    onDayClick: (date: Date) => void;
}

// Elegant, muted color palette - sophisticated pastels
const monthAccents: Record<number, { text: string; accent: string; border: string }> = {
    0: { text: 'text-rose-700 dark:text-rose-300', accent: 'bg-rose-400', border: 'border-rose-200/60' },
    1: { text: 'text-pink-700 dark:text-pink-300', accent: 'bg-pink-400', border: 'border-pink-200/60' },
    2: { text: 'text-violet-700 dark:text-violet-300', accent: 'bg-violet-400', border: 'border-violet-200/60' },
    3: { text: 'text-indigo-700 dark:text-indigo-300', accent: 'bg-indigo-400', border: 'border-indigo-200/60' },
    4: { text: 'text-blue-700 dark:text-blue-300', accent: 'bg-blue-400', border: 'border-blue-200/60' },
    5: { text: 'text-cyan-700 dark:text-cyan-300', accent: 'bg-cyan-400', border: 'border-cyan-200/60' },
    6: { text: 'text-teal-700 dark:text-teal-300', accent: 'bg-teal-400', border: 'border-teal-200/60' },
    7: { text: 'text-emerald-700 dark:text-emerald-300', accent: 'bg-emerald-400', border: 'border-emerald-200/60' },
    8: { text: 'text-lime-700 dark:text-lime-300', accent: 'bg-lime-500', border: 'border-lime-200/60' },
    9: { text: 'text-amber-700 dark:text-amber-300', accent: 'bg-amber-400', border: 'border-amber-200/60' },
    10: { text: 'text-orange-700 dark:text-orange-300', accent: 'bg-orange-400', border: 'border-orange-200/60' },
    11: { text: 'text-red-700 dark:text-red-300', accent: 'bg-red-400', border: 'border-red-200/60' },
};

export function MonthCard({ year, monthIndex, onDayClick }: MonthCardProps) {
    const dayData = usePlannerStore(state => state.dayData);
    const holidays = usePlannerStore(state => state.holidays);

    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const monthName = format(monthStart, 'MMMM');
    const style = monthAccents[monthIndex];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: monthIndex * 0.03, duration: 0.3 }}
            className={cn(
                "flex flex-col p-5 rounded-2xl",
                "bg-white/80 dark:bg-slate-900/60",
                "backdrop-blur-sm",
                "border", style.border,
                "shadow-sm hover:shadow-md transition-shadow duration-300"
            )}
        >
            {/* Elegant Month Header - Colored text with subtle underline */}
            <div className="mb-4">
                <h3 className={cn(
                    "text-lg font-semibold tracking-tight text-center",
                    style.text
                )}>
                    {monthName}
                </h3>
                <div className={cn("h-0.5 w-12 mx-auto mt-1.5 rounded-full", style.accent)} />
            </div>

            {/* Day Headers - Clean, minimal */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span
                        key={i}
                        className={cn(
                            "text-[10px] font-medium text-center py-1",
                            i >= 5
                                ? "text-violet-500 dark:text-violet-400"
                                : "text-slate-400 dark:text-slate-500"
                        )}
                    >
                        {d}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const data = dayData[dateStr];
                    const holiday = holidays.find(h => h.date === dateStr);
                    const inCurrentMonth = date.getMonth() === monthIndex;

                    return (
                        <DayCell
                            key={dateStr}
                            date={date}
                            dayData={data}
                            holiday={holiday}
                            inCurrentMonth={inCurrentMonth}
                            onClick={() => onDayClick(date)}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
}
