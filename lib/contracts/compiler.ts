import { z } from "zod";
import { LessonSpec, LessonSpecSchema } from "./lesson";

// --- Compiler Artifacts ---

export const ResearchBriefSchema = z.object({
  topic: z.string(),
  objectives: z.array(z.string()),
  misconceptions: z.array(z.string()),
  keyTerms: z.array(z.string()),
  sources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().optional(),
    snippet: z.string().optional(),
  })),
});

export const LessonSkeletonSchema = z.object({
  pdcaStructure: z.object({
    plan: z.string(), // Description of what happens in Plan
    do: z.string(),
    check: z.string(),
    act: z.string(),
  }),
  blockOutline: z.array(z.object({
    stage: z.enum(["plan", "do", "check", "act"]),
    type: z.string(),
    goal: z.string(),
  })),
});

export const ValidationReportSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  citationCoverage: z.number(), // 0-1
});

// --- Compiler Run ---

export const CompilerRunSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  topic: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  artifacts: z.object({
    brief: ResearchBriefSchema.optional(),
    skeleton: LessonSkeletonSchema.optional(),
    draftLesson: LessonSpecSchema.optional(),
    validation: ValidationReportSchema.optional(),
  }),
  provenance: z.object({
    model: z.string(),
    promptBundleVersion: z.string(),
  }),
});

// --- Versioning ---

export const LessonVersionSchema = z.object({
  id: z.string(), // version_id
  lessonId: z.string(), // stable lesson_id
  spec: LessonSpecSchema,
  compilerRunId: z.string(),
  createdAt: z.string(),
  publishedAt: z.string().optional(),
});

// --- Inferred Types ---

export type ResearchBrief = z.infer<typeof ResearchBriefSchema>;
export type LessonSkeleton = z.infer<typeof LessonSkeletonSchema>;
export type ValidationReport = z.infer<typeof ValidationReportSchema>;
export type CompilerRun = z.infer<typeof CompilerRunSchema>;
export type LessonVersion = z.infer<typeof LessonVersionSchema>;

// --- Compiler Interface ---

export interface ContentCompiler {
  generateResearchBrief(topic: string): Promise<ResearchBrief>;
  generateSkeleton(brief: ResearchBrief): Promise<LessonSkeleton>;
  authorBlocks(skeleton: LessonSkeleton, brief: ResearchBrief): Promise<LessonSpec>;
  validateLesson(lesson: LessonSpec): Promise<ValidationReport>;
  packageLessonVersion(lesson: LessonSpec, runId: string): Promise<LessonVersion>;
}
