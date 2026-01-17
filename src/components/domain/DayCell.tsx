
import { cn } from "@/lib/utils"
import { DayData, Holiday } from "@/types"
import { motion } from "framer-motion"
import { format, isToday, isWeekend } from "date-fns"
import { usePlannerStore } from "@/lib/store/usePlannerStore"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface DayCellProps {
    date: Date
    dayData?: DayData
    holiday?: Holiday
    inCurrentMonth: boolean
    onClick: () => void
}

export function DayCell({ date, dayData, holiday, inCurrentMonth, onClick }: DayCellProps) {
    const showWeekends = usePlannerStore(state => state.showWeekends);
    const showBankHolidays = usePlannerStore(state => state.showBankHolidays);
    const searchQuery = usePlannerStore(state => state.searchQuery);

    const isWknd = isWeekend(date)
    const isTdy = isToday(date)
    const isVacation = dayData?.isVacation
    const hasPlans = dayData?.plans && dayData.plans.length > 0
    const isBankHoliday = !!holiday && showBankHolidays

    // Search Logic
    const matchesSearch = searchQuery.trim().length > 0 && dayData?.plans.some(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!inCurrentMonth) {
        return <div className="aspect-square" />
    }

    // Elegant, muted tag colors
    const tagColors: Record<string, string> = {
        'Work': 'bg-indigo-400',
        'Personal': 'bg-emerald-400',
        'Travel': 'bg-amber-400',
        'Health': 'bg-rose-400',
        'Family': 'bg-purple-400',
        'Other': 'bg-slate-400'
    };

    const buttonContent = (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1",

                // Base style - ALL states darken text on hover for contrast
                "bg-white/60 dark:bg-slate-800/40",
                "text-slate-600 dark:text-slate-300",
                "hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white",

                // Weekend style - violet tint, darkens on hover
                showWeekends && isWknd && "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border-l-2 border-l-violet-400 hover:bg-violet-100 hover:text-violet-900 dark:hover:bg-violet-800/50 dark:hover:text-violet-100",

                // Vacation style - teal, darkens on hover  
                isVacation && "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 border-l-2 border-l-teal-500 font-semibold hover:bg-teal-100 hover:text-teal-900 dark:hover:bg-teal-800/50 dark:hover:text-teal-100",

                // Bank Holiday style - orange, darkens on hover
                isBankHoliday && "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-l-2 border-l-orange-400 font-semibold hover:bg-orange-100 hover:text-orange-900 dark:hover:bg-orange-800/50 dark:hover:text-orange-100",

                // Today style - amber with ring, darkens on hover
                isTdy && "ring-2 ring-amber-400 ring-offset-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 font-bold hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-800/50 dark:hover:text-amber-100",

                // Search Match
                matchesSearch && "ring-2 ring-yellow-400 ring-offset-1 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 hover:text-yellow-900",

                "cursor-pointer"
            )}
        >
            <span className="text-[11px]">{format(date, 'd')}</span>

            {/* Subtle event dots */}
            {hasPlans && (
                <div className="flex gap-0.5 mt-0.5">
                    {dayData.plans.slice(0, 3).map((plan, idx) => (
                        <div
                            key={plan.id || idx}
                            className={cn("h-1 w-1 rounded-full", tagColors[plan.tag] || 'bg-primary')}
                        />
                    ))}
                </div>
            )}
        </motion.button>
    );

    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
                {buttonContent}
            </TooltipTrigger>
            <TooltipContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex flex-col gap-1.5 text-xs">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{format(date, 'EEEE, MMM d')}</p>

                    {isBankHoliday && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                            <span className="font-medium">🎉 {holiday.name}</span>
                        </div>
                    )}

                    {isVacation && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200">
                            <span className="font-medium">🌴 On Leave</span>
                        </div>
                    )}

                    {hasPlans && (
                        <div className="flex flex-col gap-1 mt-1 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                            {dayData.plans.map(plan => (
                                <div key={plan.id} className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", tagColors[plan.tag] || 'bg-primary')} />
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{plan.title}</span>
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">• {plan.tag}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
