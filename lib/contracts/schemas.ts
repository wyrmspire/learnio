import { z } from "zod";

export const SchemaVersion = "1.0.0";

// Base Schemas
export const CapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  stability: z.enum(["high", "medium", "low"]),
  lastEvidenceAt: z.string().datetime(),
  weakestTag: z.string(),
  nextAction: z.string(),
  dueReviewsCount: z.number().int().min(0),
});

export const CapabilityUnitSchema = z.object({
  id: z.string(),
  capabilityId: z.string(),
  title: z.string(),
  status: z.enum(["locked", "unlocked", "completed"]),
});

export const ProgressEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  timestamp: z.string(), // ISO string or relative time for mock
  chips: z.array(z.string()),
  details: z.string(),
});

export const AttemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  skillId: z.string().optional(),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  cuId: z.string(),
  blockId: z.string().optional(),
  stage: z.enum(["plan", "do", "check", "act"]),
  inputs: z.record(z.string(), z.any()),
  result: z.object({
    correct: z.boolean(),
    score: z.number().optional(),
  }).optional(),
  hintsUsed: z.number().int().min(0),
  misconceptionTags: z.array(z.string()),
  timestamp: z.string().datetime(),
});

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  cuId: z.string(),
  currentStage: z.enum(["plan", "do", "check", "act"]),
  startedAt: z.string().datetime(),
});

export const RecommendationSchema = z.object({
  cuId: z.string(),
  reason: z.string(),
  type: z.enum(["review", "transfer", "new"]),
});

// Inferred Types
export type Capability = z.infer<typeof CapabilitySchema>;
export type CapabilityUnit = z.infer<typeof CapabilityUnitSchema>;
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;
export type Attempt = z.infer<typeof AttemptSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
