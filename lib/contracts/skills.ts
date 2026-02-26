import { z } from "zod";
import { LessonSpecSchema } from "../contracts/lesson";

// --- Skill Manifest ---

export const SkillManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  tags: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(), // other skill IDs
  branches: z.array(z.object({
    intent: z.string(),
    targetCourseId: z.string(),
  })).optional(),
});

// --- Course Manifest ---

export const CourseManifestSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  title: z.string(),
  description: z.string(),
  lessonOrder: z.array(z.string()), // lesson IDs
});

// --- Registry ---

export const SkillRegistrySchema = z.object({
  skills: z.array(z.object({
    id: z.string(),
    path: z.string(), // relative path to skill folder
    version: z.string(),
  })),
});

// --- Inferred Types ---

export type SkillManifest = z.infer<typeof SkillManifestSchema>;
export type CourseManifest = z.infer<typeof CourseManifestSchema>;
export type SkillRegistry = z.infer<typeof SkillRegistrySchema>;
