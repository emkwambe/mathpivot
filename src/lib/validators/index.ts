export * from './auth';

import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'Start date must be before end date',
});

// Booking validators
export const createBookingSchema = z.object({
  studentUserId: z.string().uuid(),
  tutorUserId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  modality: z.enum(['online', 'in_person']),
  notes: z.string().max(1000).optional(),
}).refine((data) => new Date(data.startAt) < new Date(data.endAt), {
  message: 'Start time must be before end time',
});

export const rescheduleBookingSchema = z.object({
  bookingId: z.string().uuid(),
  newStartAt: z.string().datetime(),
  newEndAt: z.string().datetime(),
}).refine((data) => new Date(data.newStartAt) < new Date(data.newEndAt), {
  message: 'Start time must be before end time',
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

// Session validators
export const sessionNotesSchema = z.object({
  sessionId: z.string().uuid(),
  internalNotes: z.string().max(5000).optional(),
  parentSummary: z.string().max(2000).optional(),
  nextSteps: z.string().max(1000).optional(),
});

export const sessionSkillSchema = z.object({
  sessionId: z.string().uuid(),
  skillId: z.string().uuid(),
  exposureLevel: z.enum(['introduced', 'practiced', 'assessed']),
  notes: z.string().max(500).optional(),
});

// Student profile validators
export const studentProfileSchema = z.object({
  grade: z.number().int().min(1).max(12),
  courseTrack: z.enum([
    'math_1',
    'math_2',
    'math_3',
    'pre_calc',
    'ap_calc_ab',
    'ap_calc_bc',
    'ap_stats',
  ]),
  goals: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

// Tutor availability validators
export const availabilityRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  isActive: z.boolean().default(true),
});

export const availabilityExceptionSchema = z.object({
  exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  isAvailable: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  reason: z.string().max(200).optional(),
});

// Homework validators
export const homeworkItemSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
});

export const homeworkSubmissionSchema = z.object({
  homeworkId: z.string().uuid(),
  submissionText: z.string().max(5000).optional(),
  // File handling done separately
});

export const homeworkReviewSchema = z.object({
  homeworkId: z.string().uuid(),
  reviewNotes: z.string().max(2000),
});

// Product validators
export const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  productType: z.enum(['package', 'subscription']),
  credits: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default('USD'),
  isActive: z.boolean().default(true),
});

// Skill validators
export const skillSchema = z.object({
  courseTrack: z.enum([
    'math_1',
    'math_2',
    'math_3',
    'pre_calc',
    'ap_calc_ab',
    'ap_calc_bc',
    'ap_stats',
  ]),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  orderIndex: z.number().int().nonnegative().default(0),
});

// Mastery update validator
export const masteryUpdateSchema = z.object({
  studentUserId: z.string().uuid(),
  skillId: z.string().uuid(),
  masteryLevel: z.enum(['not_started', 'developing', 'proficient', 'mastered']),
});

// Type exports
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type SessionNotesInput = z.infer<typeof sessionNotesSchema>;
export type SessionSkillInput = z.infer<typeof sessionSkillSchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
export type AvailabilityExceptionInput = z.infer<typeof availabilityExceptionSchema>;
export type HomeworkItemInput = z.infer<typeof homeworkItemSchema>;
export type HomeworkSubmissionInput = z.infer<typeof homeworkSubmissionSchema>;
export type HomeworkReviewInput = z.infer<typeof homeworkReviewSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type MasteryUpdateInput = z.infer<typeof masteryUpdateSchema>;
