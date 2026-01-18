'use client';

import { usePlannerStore } from '@/lib/store/usePlannerStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays } from 'lucide-react';
import { Plan } from '@/types';

interface UpcomingPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpcomingPanel({ open, onOpenChange }: UpcomingPanelProps) {
    const { dayData, holidays, showBankHolidays, openDrawer } = usePlannerStore();

    // Look ahead 90 days for better planning view
    const today = startOfDay(new Date());
    const next90Days = Array.from({ length: 90 }, (_, i) => addDays(today, i));

    // Consolidate Plans logic
    // We need to group plans by parentId (or id if no parentId)
    // Map key: planId/parentId -> { plan details, startDate, endDate, allDates[] }
    interface ConsolidatedPlan {
        id: string; // Group ID
        title: string;
        tag: string;
        notes?: string;
        requiresHoliday?: boolean;
        startDate: Date;
        endDate: Date;
        originalPlan: Plan; // Keep one reference for callbacks
        type: 'plan' | 'holiday';
    }

    const planGroups: Record<string, ConsolidatedPlan> = {};
    const processedPlanIds = new Set<string>(); // Track individual plan instance IDs to avoid dupes if we iterate dates

    // Store bank holidays as separate list or integrated?
    // User wants "upcoming plans". Bank holidays are context. 
    // Let's create a list of items that includes both.
    const items: ConsolidatedPlan[] = [];

    // Pre-calculate bank holidays in range
    const bankHolidaysSet = new Set<string>();
    if (showBankHolidays) {
        holidays.forEach(h => {
            // Check if in range
            const hDate = new Date(h.date);
            if (hDate >= today && hDate <= next90Days[next90Days.length - 1]) {
                bankHolidaysSet.add(h.date);
                items.push({
                    id: `holiday-${h.date}`,
                    title: h.name,
                    tag: 'Bank Holiday',
                    startDate: hDate,
                    endDate: hDate,
                    type: 'holiday',
                    originalPlan: {} as Plan // Dummy
                });
            }
        });
    }

    // Scan days
    next90Days.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const day = dayData[dateStr];

        if (day?.plans) {
            day.plans.forEach(plan => {
                if (processedPlanIds.has(plan.id)) return;

                const groupId = plan.parentId || plan.id;

                if (!planGroups[groupId]) {
                    planGroups[groupId] = {
                        id: groupId,
                        title: plan.title,
                        tag: plan.tag,
                        notes: plan.notes,
                        requiresHoliday: plan.requiresHoliday,
                        startDate: date,
                        endDate: date,
                        originalPlan: plan,
                        type: 'plan'
                    };
                } else {
                    // Update ends
                    const group = planGroups[groupId];
                    if (date < group.startDate) group.startDate = date;
                    if (date > group.endDate) group.endDate = date;
                }

                processedPlanIds.add(plan.id);
            });
        }
    });

    // Add consolidated plans to items
    Object.values(planGroups).forEach(group => items.push(group));

    // Sort all items by start date
    items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[100%] sm:w-[400px] flex flex-col p-0 gap-0">
                <SheetHeader className="px-6 py-5 border-b">
                    <SheetTitle>Upcoming Plans</SheetTitle>
                    <SheetDescription>
                        Your agenda for the next 3 months.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-6">
                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground opacity-50">
                                <CalendarDays className="h-12 w-12 mb-3 stroke-1" />
                                <p>No upcoming plans found.</p>
                            </div>
                        ) : (
                            items.map((item) => {
                                const isMultiDay = !isSameDay(item.startDate, item.endDate);
                                const dateRange = isMultiDay
                                    ? `${format(item.startDate, 'MMM d')} - ${format(item.endDate, 'MMM d')}`
                                    : format(item.startDate, 'EEEE, MMM d');

                                const daysAway = Math.ceil((item.startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                const relativeTime = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `in ${daysAway} days`;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            if (item.type === 'plan') {
                                                onOpenChange(false);
                                                openDrawer(format(item.startDate, 'yyyy-MM-dd'));
                                            }
                                        }}
                                        className={`
                                            relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md
                                            ${item.type === 'holiday'
                                                ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/30'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className={`font-semibold text-base ${item.type === 'holiday' ? 'text-orange-700 dark:text-orange-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                                    {item.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                        {dateRange}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                        {relativeTime}
                                                    </span>
                                                </div>
                                            </div>
                                            {item.type === 'plan' && (
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                        {item.tag}
                                                    </Badge>
                                                    {item.requiresHoliday && (
                                                        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-none text-[10px] h-5 px-2">
                                                            Holiday
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {item.notes && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 pl-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                                                {item.notes}
                                            </p>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
