'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDataStore } from '@/lib/store/useDataStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';

const SettingsSchema = z.object({
    baseAllowance: z.number().min(0, "Allowance must be non-negative"),
    rolloverDays: z.number().min(0, "Rollover days must be non-negative"),
    rolloverExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

type SettingsFormValues = z.infer<typeof SettingsSchema>;

interface HolidaySettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HolidaySettingsDialog({ open, onOpenChange }: HolidaySettingsDialogProps) {
    const { holidaySettings, updateHolidaySettings } = useDataStore();

    // We explicitly cast the default values because the form needs to know these are valid
    // even though the Zod schema is strict about numbers.
    const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: holidaySettings
    });

    useEffect(() => {
        if (open) {
            reset(holidaySettings);
        }
    }, [open, holidaySettings, reset]);

    const onSubmit = (data: SettingsFormValues) => {
        updateHolidaySettings(data);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Holiday Settings</DialogTitle>
                    <DialogDescription>
                        Configure your holiday allowance and rollover days for the year.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="baseAllowance" className="text-right">
                            Allowance
                        </Label>
                        <Input
                            id="baseAllowance"
                            type="number"
                            className="col-span-3"
                            {...register('baseAllowance', { valueAsNumber: true })}
                        />
                        {errors.baseAllowance && <p className="col-span-4 text-right text-xs text-destructive">{errors.baseAllowance.message}</p>}
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rolloverDays" className="text-right">
                            Rollover
                        </Label>
                        <Input
                            id="rolloverDays"
                            type="number"
                            className="col-span-3"
                            {...register('rolloverDays', { valueAsNumber: true })}
                        />
                        {errors.rolloverDays && <p className="col-span-4 text-right text-xs text-destructive">{errors.rolloverDays.message}</p>}
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rolloverExpiryDate" className="text-right">
                            Expires On
                        </Label>
                        <Input
                            id="rolloverExpiryDate"
                            type="date"
                            className="col-span-3"
                            {...register('rolloverExpiryDate')}
                        />
                        {errors.rolloverExpiryDate && <p className="col-span-4 text-right text-xs text-destructive">{errors.rolloverExpiryDate.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
