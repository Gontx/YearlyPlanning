'use client';

import { useDataStore } from '@/lib/store/useDataStore';
import { useUIStore } from '@/lib/store/useUIStore';
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
import { Trash2, Plus, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

// Schema for the form, omitting ID and createdAt as they are generated
// Extended with endDate for multi-day plans
const PlanFormSchema = PlanSchema.omit({ id: true, createdAt: true, parentId: true }).extend({
    startDate: z.string().optional(),
    endDate: z.string().optional()
});
type PlanFormValues = z.infer<typeof PlanFormSchema>;

interface DayDetailsDrawerProps {
    // Props are no longer needed for open/close as it is in store, 
    // but we might still accept them if strictly controlled. 
    // Ideally we remove them and use store state, but for minimal refactor let's see usage.
    // The current signature is: { open, onOpenChange, date }
    // These match what the parent does.
    // However, the previous code IGNORED the props in favor of store state inside the drawer??
    // Wait, the previous code took `open` prop but ALSO used store actions inside?
    // Actually no, previous code took props but called store actions for data.
    // AND `Header` or `YearGrid` called `openDrawer` in store.
    // So there is a mix.
    // Let's defer to what the component expects.
    // If this component is controlled by parent, we keep props.
    // If it's controlled by store (global drawer), we should use store.
    // Given `usePlannerStore` had `isDrawerOpen`, it seems it was intended to be global.
    // But `DayDetailsDrawer` receives `open` prop.
    // Let's assume for now we switch to store control completely or keep pure.
    // Looking at usage in YearGrid might clarify.
}

export function DayDetailsDrawer() {
    const isDrawerOpen = useUIStore(state => state.isDrawerOpen);
    const selectedDate = useUIStore(state => state.selectedDate);
    const closeDrawer = useUIStore(state => state.closeDrawer);

    const dayData = useDataStore(state => state.dayData);
    const addPlan = useDataStore(state => state.addPlan);
    const addMultiDayPlan = useDataStore(state => state.addMultiDayPlan);
    const removePlan = useDataStore(state => state.removePlan);
    const getPlanRange = useDataStore(state => state.getPlanRange);
    const editPlan = useDataStore(state => state.editPlan);

    // Mapping store state to local convenient variables
    const open = isDrawerOpen;
    const dateStr = selectedDate;
    const date = dateStr ? new Date(dateStr) : null;
    const onOpenChange = (isOpen: boolean) => !isOpen && closeDrawer();

    // UI State
    const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
    const currentDayData = date ? dayData[formattedDate] : null;
    const plans = currentDayData?.plans || [];

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PlanFormValues>({
        resolver: zodResolver(PlanFormSchema),
        defaultValues: {
            title: '',
            time: '',
            tag: 'Personal',
            notes: '',
            startDate: '',
            endDate: '',
            requiresHoliday: false
        }
    });

    // Reset form when drawer closes or date changes
    useEffect(() => {
        if (open) {
            reset();
            setIsAddPlanOpen(false); // Collapsed by default
            setEditingPlan(null);
        }
        // Depend on stable string `selectedDate` instead of new Date object `date`
    }, [open, selectedDate, reset]);

    const handleEdit = (plan: Plan) => {
        const range = getPlanRange(plan);
        setEditingPlan(plan);
        setValue('title', plan.title);
        setValue('time', plan.time || '');
        setValue('tag', plan.tag);
        setValue('notes', plan.notes || '');
        setValue('startDate', range.startDate || formattedDate);
        setValue('endDate', range.endDate || formattedDate);
        setValue('requiresHoliday', plan.requiresHoliday || false);

        setIsAddPlanOpen(true);
    };

    const onSubmit = async (data: PlanFormValues) => {
        if (!formattedDate) return;

        const start = data.startDate || formattedDate;
        const end = data.endDate || start;

        const newPlanData: Plan = {
            id: editingPlan?.id || uuidv4(),
            createdAt: editingPlan?.createdAt || Date.now(),
            title: data.title,
            time: data.time,
            tag: data.tag,
            notes: data.notes,
            requiresHoliday: data.requiresHoliday
        };

        // Note: The isVacation arg is now legacy/unused in most stores if logic is derived, 
        // but we pass `data.requiresHoliday` to be explicit for legacy method signatures if needed.
        // Our updated store uses `newPlanData.requiresHoliday`.

        if (editingPlan) {
            await editPlan(editingPlan, start, end, newPlanData);
        } else {
            if (end > start) {
                await addMultiDayPlan(start, end, newPlanData);
            } else {
                if (start !== formattedDate) {
                    await addPlan(start, newPlanData);
                } else {
                    await addPlan(formattedDate, newPlanData);
                }
            }
        }

        reset();
        setIsAddPlanOpen(false); // Close after successful add
        setEditingPlan(null);
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
                        Manage plans for this day.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

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
                                        className={`group relative p-4 border rounded-xl bg-white dark:bg-slate-900 transition-all duration-200 ${plan.requiresHoliday
                                            ? 'border-teal-200 dark:border-teal-900 bg-teal-50/30 dark:bg-teal-900/10'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-primary/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="font-semibold text-base text-slate-800 dark:text-slate-200">
                                                        {plan.title}
                                                    </span>
                                                    {plan.requiresHoliday && (
                                                        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 border-none text-[10px] h-5">
                                                            Holiday
                                                        </Badge>
                                                    )}
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
                                            <div className="flex gap-1 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                    onClick={() => handleEdit(plan)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    onClick={() => handleDelete(plan.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
                                    {editingPlan ? 'Edit Plan' : 'New Plan Details'}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-transparent text-slate-400 hover:text-slate-600"
                                    onClick={() => {
                                        setIsAddPlanOpen(false);
                                        setEditingPlan(null);
                                        reset();
                                    }}
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
                                        <Label htmlFor="startDate" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Starts On</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            className="bg-white dark:bg-slate-900"
                                            defaultValue={formattedDate}
                                            {...register('startDate')}
                                        />
                                    </div>
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
                                            min={formattedDate} // Maybe allow past dates?
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

                                <div className="flex items-center space-x-2 py-2">
                                    <Switch
                                        id="requiresHoliday"
                                        checked={watch('requiresHoliday')}
                                        onCheckedChange={(checked) => setValue('requiresHoliday', checked)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label
                                            htmlFor="requiresHoliday"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Book Holiday (Annual Leave)
                                        </Label>
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            Deducts from holiday allowance for working days in range.
                                        </p>
                                    </div>
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
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => {
                                        setIsAddPlanOpen(false);
                                        setEditingPlan(null);
                                        reset();
                                    }}>
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
