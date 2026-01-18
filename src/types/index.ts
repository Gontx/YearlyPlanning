import { z } from 'zod';

// --- Domain Types ---

export type PlanCategory = 'Work' | 'Personal' | 'Travel' | 'Health' | 'Family' | 'Other';

export interface Plan {
  id: string;
  title: string;
  time?: string; // HH:mm or similar
  tag: PlanCategory;
  notes?: string;
  parentId?: string; // For multi-day events
  requiresHoliday?: boolean; // If true, this plan consumes holiday allowance
  createdAt: number; // timestamp
}

export interface DayData {
  date: string; // ISO 8601 YYYY-MM-DD
  isVacation: boolean;
  plans: Plan[];
}

export type HolidayType = 'bank_holiday';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: HolidayType;
  region?: string; // e.g., 'ES', 'US'
}

export interface HolidaySettings {
  baseAllowance: number;
  rolloverDays: number;
  rolloverExpiryDate: string; // YYYY-MM-DD
}

// --- Zod Schemas for Validation ---

export const PlanSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  time: z.string().optional(),
  tag: z.enum(['Work', 'Personal', 'Travel', 'Health', 'Family', 'Other']),
  notes: z.string().optional(),
  parentId: z.string().optional(),
  requiresHoliday: z.boolean().optional(),
  createdAt: z.number(),
});

export const DayDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isVacation: z.boolean(),
  plans: z.array(PlanSchema),
});

export const HolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string(),
  type: z.literal('bank_holiday'),
  region: z.string().optional(),
});
