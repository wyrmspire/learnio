import { z } from "zod";

// --- Primitives ---

export const CitationSchema = z.object({
  id: z.string(),
  text: z.string(),
  url: z.string().optional(),
  sourceId: z.string().optional(), // Link to research run source
});

export const AssetSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video", "diagram", "code"]),
  url: z.string(),
  caption: z.string().optional(),
});

// --- Block Types ---

const BaseBlockSchema = z.object({
  id: z.string(),
  // Common metadata
  remediationTargets: z.array(z.string()).optional(), // Misconception tags addressed
});

export const ExplainerBlockSchema = BaseBlockSchema.extend({
  type: z.literal("explainer"),
  markdown: z.string(),
  assetId: z.string().optional(),
});

export const DiagramBlockSchema = BaseBlockSchema.extend({
  type: z.literal("diagram"),
  diagramType: z.enum(["mermaid", "svg"]),
  content: z.string(), // Mermaid code or SVG string
  caption: z.string().optional(),
});

export const ScenarioBlockSchema = BaseBlockSchema.extend({
  type: z.literal("scenario"),
  title: z.string(),
  description: z.string(),
  assetId: z.string().optional(),
});

export const PredictionBlockSchema = BaseBlockSchema.extend({
  type: z.literal("prediction"),
  prompt: z.string(),
  placeholder: z.string().optional(),
  correctAnswerReveal: z.string().optional(), // Shown after commit
});

export const ExerciseBlockSchema = BaseBlockSchema.extend({
  type: z.literal("exercise"),
  prompt: z.string(),
  initialCode: z.string().optional(),
  language: z.string().optional(), // for code exercises
  hints: z.array(z.string()), // Hint ladder
  solution: z.string().optional(),
  validation: z.object({
    type: z.enum(["regex", "llm", "manual"]),
    rule: z.string().optional(),
  }).optional(),
});

export const QuizBlockSchema = BaseBlockSchema.extend({
  type: z.literal("quiz"),
  question: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
    feedback: z.string().optional(),
  })),
});

export const ReflectionBlockSchema = BaseBlockSchema.extend({
  type: z.literal("reflection"),
  prompt: z.string(),
});

export const TodoBlockSchema = BaseBlockSchema.extend({
  type: z.literal("todo"),
  text: z.string(),
});

// Discriminated Union of all Blocks
export const LessonBlockSchema = z.discriminatedUnion("type", [
  ExplainerBlockSchema,
  DiagramBlockSchema,
  ScenarioBlockSchema,
  PredictionBlockSchema,
  ExerciseBlockSchema,
  QuizBlockSchema,
  ReflectionBlockSchema,
  TodoBlockSchema,
]);

// --- Stage Schemas ---

export const StageContentSchema = z.object({
  blocks: z.array(LessonBlockSchema),
});

// --- Lesson Spec ---

export const LessonSpecSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal("1.0.0"),
  version: z.string(),
  
  // Metadata
  title: z.string(),
  topic: z.string(),
  description: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedDuration: z.number().int().min(1), // minutes
  tags: z.array(z.string()),
  
  // Capability Mapping
  capabilityIds: z.array(z.string()),
  cuIds: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(),
  
  // Content (PDCA)
  stages: z.object({
    plan: StageContentSchema,
    do: StageContentSchema,
    check: StageContentSchema,
    act: StageContentSchema,
  }),
  
  // Provenance
  provenance: z.object({
    generatorModel: z.string(),
    promptBundleVersion: z.string(),
    researchRunId: z.string().optional(),
  }).optional(),
  
  citations: z.array(CitationSchema).optional(),
});

// --- Inferred Types ---

export type Citation = z.infer<typeof CitationSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type LessonBlock = z.infer<typeof LessonBlockSchema>;
export type ExplainerBlock = z.infer<typeof ExplainerBlockSchema>;
export type DiagramBlock = z.infer<typeof DiagramBlockSchema>;
export type ScenarioBlock = z.infer<typeof ScenarioBlockSchema>;
export type PredictionBlock = z.infer<typeof PredictionBlockSchema>;
export type ExerciseBlock = z.infer<typeof ExerciseBlockSchema>;
export type QuizBlock = z.infer<typeof QuizBlockSchema>;
export type ReflectionBlock = z.infer<typeof ReflectionBlockSchema>;
export type TodoBlock = z.infer<typeof TodoBlockSchema>;
export type LessonSpec = z.infer<typeof LessonSpecSchema>;
