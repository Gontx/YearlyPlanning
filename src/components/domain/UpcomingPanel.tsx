'use client';

import { usePlannerStore } from '@/lib/store/usePlannerStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays } from 'lucide-react';

interface UpcomingPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpcomingPanel({ open, onOpenChange }: UpcomingPanelProps) {
    const { dayData, holidays, showBankHolidays, openDrawer } = usePlannerStore();

    const today = startOfDay(new Date());
    const next30Days = Array.from({ length: 30 }, (_, i) => addDays(today, i));

    const upcomingEvents = next30Days.reduce((acc, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const day = dayData[dateStr];
        const holiday = holidays.find(h => h.date === dateStr);

        const events = [];

        if (showBankHolidays && holiday) {
            events.push({ type: 'holiday', title: holiday.name, date });
        }

        if (day?.plans) {
            day.plans.forEach(plan => {
                events.push({ type: 'plan', title: plan.title, tag: plan.tag, date, notes: plan.notes });
            });
        }

        if (day?.isVacation) {
            events.push({ type: 'vacation', title: 'Vacation', date });
        }

        if (events.length > 0) {
            acc.push({ date, events });
        }

        return acc;
    }, [] as { date: Date, events: any[] }[]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[100%] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>Upcoming (30 Days)</SheetTitle>
                    <SheetDescription>
                        You have {upcomingEvents.reduce((acc, d) => acc + d.events.length, 0)} events coming up.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                    <div className="space-y-6">
                        {upcomingEvents.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">No upcoming events.</p>
                        ) : (
                            upcomingEvents.map((item) => (
                                <div key={item.date.toISOString()} className="space-y-2">
                                    <h4 className="font-medium text-sm text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b flex items-center justify-between">
                                        <span>{format(item.date, 'EEEE, MMM d')}</span>
                                        <span className="text-xs font-normal opacity-70">
                                            {isSameDay(item.date, new Date()) ? 'Today' :
                                                isSameDay(item.date, addDays(new Date(), 1)) ? 'Tomorrow' :
                                                    format(item.date, 'R')}
                                        </span>
                                    </h4>
                                    <div className="space-y-2">
                                        {item.events.map((event, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    onOpenChange(false); // Close upcoming panel
                                                    openDrawer(format(item.date, 'yyyy-MM-dd')); // Open day drawer
                                                }}
                                                className="flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                                            >
                                                <div className={`h-2 w-2 rounded-full shrink-0 ring-offset-2 ring-1 ring-transparent group-hover:ring-current transition-all ${event.type === 'holiday' ? 'bg-red-500 text-red-500' :
                                                    event.type === 'vacation' ? 'bg-teal-500 text-teal-500' : 'bg-blue-500 text-blue-500'
                                                    }`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium truncate group-hover:text-primary transition-colors">{event.title}</span>
                                                        {event.tag && <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{event.tag}</Badge>}
                                                    </div>
                                                    {event.notes && <p className="text-xs text-muted-foreground line-clamp-1">{event.notes}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
