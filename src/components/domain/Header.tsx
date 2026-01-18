'use client';

import { usePlannerStore } from '@/lib/store/usePlannerStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Settings, Search, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { UpcomingPanel } from './UpcomingPanel';
import { HolidaySettingsDialog } from './HolidaySettingsDialog';
import { UserMenu } from '@/components/auth/UserMenu';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { format, startOfDay, addDays, isWeekend } from 'date-fns';

export function Header() {
    const {
        currentYear,
        setYear,
        showWeekends,
        toggleWeekends,
        showBankHolidays,
        toggleBankHolidays,
        searchQuery,
        setSearchQuery
    } = usePlannerStore();

    const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const dayData = usePlannerStore(state => state.dayData);
    const holidaySettings = usePlannerStore(state => state.holidaySettings);

    const holidays = usePlannerStore(state => state.holidays);
    const bankHolidayDates = new Set(holidays.map(h => h.date));

    // Only count working days (not weekends, not bank holidays) as used allowance
    const vacationDays = Object.values(dayData).filter(d => {
        if (!d.isVacation) return false;
        const dateObj = new Date(d.date);
        return !isWeekend(dateObj) && !bankHolidayDates.has(d.date);
    }).length; // .length counts the working days marked as vacation

    const totalAllowance = holidaySettings.baseAllowance + holidaySettings.rolloverDays;
    const hasRollover = holidaySettings.rolloverDays > 0;
    const isOverBudget = vacationDays > totalAllowance;

    // Calculate upcoming events for badge (next 7 days)
    const today = startOfDay(new Date());
    const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    const upcomingCount = next7Days.reduce((count, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const day = dayData[dateStr];
        const holiday = usePlannerStore.getState().holidays.find(h => h.date === dateStr);

        // Use current store state for bank holidays toggle check
        let events = 0;
        if (day?.plans) events += day.plans.length;
        if (day?.isVacation) events += 1;
        if (showBankHolidays && holiday) events += 1;

        return count + events;
    }, 0);

    return (
        <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="container flex h-14 items-center justify-between mx-auto px-4">

                {/* Left Section: Title & Search */}
                <div className="flex items-center gap-6">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                        Year Planner
                    </h1>
                    <div className="hidden md:flex relative w-56 items-center">
                        <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search plans..."
                            className="pl-9 h-9 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right Section: Controls */}
                <div className="flex items-center gap-3">

                    {/* Vacation Stats - Elegant pill */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className={`hidden md:flex items-center px-3 py-1.5 rounded-full text-xs font-medium gap-1.5 cursor-pointer transition-colors ${isOverBudget
                            ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                            }`}
                        title="Configure Holiday Settings"
                    >
                        <span className="font-semibold">{vacationDays}</span>
                        <span className="opacity-70">/ {totalAllowance}</span>
                        {hasRollover && (
                            <span className="text-[10px] opacity-60 border-l border-current/30 pl-1.5 ml-0.5">
                                +{holidaySettings.rolloverDays}
                            </span>
                        )}
                    </button>

                    {/* Upcoming Panel Button */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => setIsUpcomingOpen(true)}
                            title="Upcoming Events"
                        >
                            <CalendarDays className="h-4 w-4" />
                        </Button>
                        {upcomingCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                                {upcomingCount > 9 ? '9+' : upcomingCount}
                            </span>
                        )}
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-white dark:hover:bg-slate-700"
                            onClick={() => setYear(currentYear - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold min-w-[3.5rem] text-center">{currentYear}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-white dark:hover:bg-slate-700"
                            onClick={() => setYear(currentYear + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="hidden md:flex items-center gap-4 ml-2">
                        <div className="flex items-center space-x-2">
                            <Switch id="weekends" checked={showWeekends} onCheckedChange={toggleWeekends} />
                            <Label htmlFor="weekends" className="text-sm text-slate-600 dark:text-slate-400">Weekends</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="bank-holidays" checked={showBankHolidays} onCheckedChange={toggleBankHolidays} />
                            <Label htmlFor="bank-holidays" className="text-sm text-slate-600 dark:text-slate-400">Holidays</Label>
                        </div>
                    </div>

                    {/* Mobile Settings */}
                    <div className="md:hidden">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9"><Settings className="h-4 w-4" /></Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-56">
                                <div className="grid gap-4">
                                    <div className="font-medium text-sm">Settings</div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="mobile-weekends" className="text-sm">Weekends</Label>
                                        <Switch id="mobile-weekends" checked={showWeekends} onCheckedChange={toggleWeekends} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="mobile-bank-holidays" className="text-sm">Holidays</Label>
                                        <Switch id="mobile-bank-holidays" checked={showBankHolidays} onCheckedChange={toggleBankHolidays} />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* User Menu */}
                    <UserMenu />
                </div>
            </div>

            <UpcomingPanel open={isUpcomingOpen} onOpenChange={setIsUpcomingOpen} />
            <HolidaySettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </header>
    );
}
