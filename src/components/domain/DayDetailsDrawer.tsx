'use client';

import { usePlannerStore } from '@/lib/store/usePlannerStore';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plan, PlanCategory, PlanSchema } from '@/types';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

// Schema for the form, omitting ID and createdAt as they are generated
// Extended with endDate for multi-day plans
const PlanFormSchema = PlanSchema.omit({ id: true, createdAt: true, parentId: true }).extend({
    endDate: z.string().optional()
});
type PlanFormValues = z.infer<typeof PlanFormSchema>;

interface DayDetailsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: Date | null;
}

export function DayDetailsDrawer({ open, onOpenChange, date }: DayDetailsDrawerProps) {
    const {
        dayData,
        toggleVacation,
        addPlan,
        addMultiDayPlan,
        removePlan
    } = usePlannerStore();

    // UI State
    const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);

    const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
    const currentDayData = date ? dayData[formattedDate] : null;
    const isVacation = currentDayData?.isVacation || false;
    const plans = currentDayData?.plans || [];

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlanFormValues>({
        resolver: zodResolver(PlanFormSchema),
        defaultValues: {
            title: '',
            time: '',
            tag: 'Personal',
            notes: '',
            endDate: '' // optional
        }
    });

    // Reset form when drawer closes or date changes
    useEffect(() => {
        if (open) {
            reset();
            setIsAddPlanOpen(false); // Collapsed by default
        }
    }, [open, date, reset]);

    const onSubmit = async (data: PlanFormValues) => {
        if (!formattedDate) return;

        const newPlan: Plan = {
            id: uuidv4(),
            createdAt: Date.now(),
            title: data.title,
            time: data.time,
            tag: data.tag,
            notes: data.notes
        };

        if (data.endDate && data.endDate > formattedDate) {
            // Pass the current isVacation state to mark all workdays as vacation
            await addMultiDayPlan(formattedDate, data.endDate, newPlan, isVacation);
        } else {
            await addPlan(formattedDate, newPlan);
        }

        reset();
        setIsAddPlanOpen(false); // Close after successful add
    };

    const handleDelete = async (planId: string) => {
        if (!formattedDate) return;
        await removePlan(formattedDate, planId);
    };

    if (!date) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* Increased width to 480px for better breathing room */}
            <SheetContent className="w-[100%] sm:w-[500px] flex flex-col h-full overflow-hidden p-0 gap-0 border-l border-slate-200 dark:border-slate-800 shadow-2xl">
                <SheetHeader className="px-6 py-5 border-b bg-muted/10">
                    <SheetTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        {format(date, 'EEEE, MMMM d, yyyy')}
                    </SheetTitle>
                    <SheetDescription className="text-base">
                        Manage plans and status for this day.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                    {/* Vacation Section */}
                    <div className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm transition-all hover:shadow-md">
                        <div className="space-y-1">
                            <Label className="text-base font-semibold">Taken Holiday</Label>
                            <div className="text-sm text-muted-foreground mr-4">
                                Mark this day as annual leave.
                            </div>
                        </div>
                        <Switch
                            checked={isVacation}
                            onCheckedChange={() => toggleVacation(formattedDate)}
                            className="data-[state=checked]:bg-teal-500"
                        />
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Plans Section */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-widest">
                                Plans ({plans.length})
                            </h3>

                            {!isAddPlanOpen && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddPlanOpen(true)}
                                    className="gap-2 h-8 text-xs font-medium"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Plan
                                </Button>
                            )}
                        </div>

                        {plans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-3">
                                    <Plus className="h-5 w-5 text-slate-400" />
                                </div>
                                <p className="text-muted-foreground text-sm font-medium">No plans managed for this day yet.</p>
                                {!isAddPlanOpen && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setIsAddPlanOpen(true)}
                                        className="mt-1 text-primary"
                                    >
                                        Create one now
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="group relative p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-primary/20 hover:shadow-sm transition-all duration-200"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="font-semibold text-base text-slate-800 dark:text-slate-200">
                                                        {plan.title}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] h-5 px-2 font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                    >
                                                        {plan.tag}
                                                    </Badge>
                                                    {plan.time && (
                                                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                                            {plan.time}
                                                        </span>
                                                    )}
                                                </div>
                                                {plan.notes && (
                                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                        {plan.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                onClick={() => handleDelete(plan.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Plan Form - Collapsible */}
                    {isAddPlanOpen && (
                        <div className="border border-indigo-100 dark:border-indigo-900/50 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 p-5 space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm text-indigo-900 dark:text-indigo-200">
                                    New Plan Details
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-transparent text-slate-400 hover:text-slate-600"
                                    onClick={() => setIsAddPlanOpen(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <span aria-hidden="true" className="text-lg">×</span>
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Flight to Paris"
                                        className="bg-white dark:bg-slate-900"
                                        {...register('title')}
                                    />
                                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="time" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            className="bg-white dark:bg-slate-900"
                                            {...register('time')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="endDate" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ends On</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            min={formattedDate}
                                            className="bg-white dark:bg-slate-900"
                                            {...register('endDate')}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tag" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</Label>
                                    <Select onValueChange={(val) => setValue('tag', val as PlanCategory)} defaultValue="Personal">
                                        <SelectTrigger className="bg-white dark:bg-slate-900">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Work">Work</SelectItem>
                                            <SelectItem value="Personal">Personal</SelectItem>
                                            <SelectItem value="Travel">Travel</SelectItem>
                                            <SelectItem value="Health">Health</SelectItem>
                                            <SelectItem value="Family">Family</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="notes" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Additional details..."
                                        className="resize-none bg-white dark:bg-slate-900"
                                        rows={3}
                                        {...register('notes')}
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddPlanOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1">
                                        Save Plan
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
