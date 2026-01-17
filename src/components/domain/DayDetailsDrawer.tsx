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
import { useEffect } from 'react';

// Schema for the form, omitting ID and createdAt as they are generated
const PlanFormSchema = PlanSchema.omit({ id: true, createdAt: true, parentId: true });
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

    const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
    const currentDayData = date ? dayData[formattedDate] : null;
    const isVacation = currentDayData?.isVacation || false;
    const plans = currentDayData?.plans || [];

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlanFormValues & { endDate?: string }>({
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
        }
    }, [open, date, reset]);

    const onSubmit = async (data: PlanFormValues & { endDate?: string }) => {
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
            await addMultiDayPlan(formattedDate, data.endDate, newPlan);
        } else {
            await addPlan(formattedDate, newPlan);
        }

        reset();
    };

    const handleDelete = async (planId: string) => {
        if (!formattedDate) return;
        await removePlan(formattedDate, planId);
    };

    if (!date) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[100%] sm:w-[440px] flex flex-col h-full overflow-hidden">
                <SheetHeader>
                    <SheetTitle>{format(date, 'EEEE, MMMM d, yyyy')}</SheetTitle>
                    <SheetDescription>
                        Manage plans and status for this day.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {/* Vacation Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-base">Taken Holiday</Label>
                            <div className="text-sm text-muted-foreground">
                                Mark this day as a vacation.
                            </div>
                        </div>
                        <Switch
                            checked={isVacation}
                            onCheckedChange={() => toggleVacation(formattedDate)}
                        />
                    </div>

                    <Separator />

                    {/* Existing Plans */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Plans</h3>
                        {plans.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm italic border-2 border-dashed rounded-lg">
                                No plans yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {plans.map((plan) => (
                                    <div key={plan.id} className="group relative p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold">{plan.title}</span>
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                        {plan.tag}
                                                    </Badge>
                                                    {plan.time && (
                                                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1 rounded">{plan.time}</span>
                                                    )}
                                                </div>
                                                {plan.notes && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{plan.notes}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
                                                onClick={() => handleDelete(plan.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Add Plan Form */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Add New Plan</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-1">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" placeholder="e.g. Flight to Paris" {...register('title')} />
                                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="time">Time (Optional)</Label>
                                    <Input id="time" type="time" {...register('time')} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endDate" className="text-muted-foreground">End Date (Optional)</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        min={formattedDate}
                                        {...register('endDate')}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tag">Category</Label>
                                <Select onValueChange={(val) => setValue('tag', val as PlanCategory)} defaultValue="Personal">
                                    <SelectTrigger>
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
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea id="notes" placeholder="Additional details..." {...register('notes')} />
                            </div>

                            <Button type="submit" className="w-full mt-2" size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Add Plan
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
