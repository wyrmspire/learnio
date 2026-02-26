import { 
  ContentCompiler, 
  ResearchBrief, 
  LessonSkeleton, 
  ValidationReport, 
  LessonVersion,
  ResearchBriefSchema,
  LessonSkeletonSchema,
  ValidationReportSchema,
  LessonVersionSchema,
  CompilerRun
} from "../contracts/compiler";
import { LessonSpec, LessonSpecSchema } from "../contracts/lesson";
import { mockRustLesson } from "./mock-lessons";
import { lessonStore } from "./lesson-store";

export class MockContentCompiler implements ContentCompiler {
  private delay = 800;

  // Helper to ensure schema compliance at boundaries
  private async simulateStep<T>(data: T, schema: any, delay = 800): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, delay));
    return schema.parse(data);
  }

  async generateResearchBrief(topic: string): Promise<ResearchBrief> {
    const brief = {
      topic,
      objectives: ["Understand core concepts", "Apply to problem", "Verify understanding"],
      misconceptions: ["Common error 1", "Common error 2"],
      keyTerms: ["Term A", "Term B"],
      sources: [
        { id: "src-1", title: "Official Documentation", url: "https://example.com" },
        { id: "src-2", title: "Community Guide", snippet: "Key insight here..." }
      ]
    };
    return this.simulateStep(brief, ResearchBriefSchema, this.delay);
  }

  async generateSkeleton(brief: ResearchBrief): Promise<LessonSkeleton> {
    const skeleton: LessonSkeleton = {
      pdcaStructure: {
        plan: "Explain concept and predict outcome",
        do: "Execute task with constraints",
        check: "Verify results against prediction",
        act: "Reflect and plan next steps"
      },
      blockOutline: [
        { stage: "plan", type: "explainer", goal: "Intro" },
        { stage: "do", type: "exercise", goal: "Practice" }
      ]
    };
    return this.simulateStep(skeleton, LessonSkeletonSchema, this.delay);
  }

  async authorBlocks(skeleton: LessonSkeleton, brief: ResearchBrief): Promise<LessonSpec> {
    // STABLE ID: Derive lesson ID from topic slug to ensure continuity across versions
    const slug = brief.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const lessonId = `lesson-${slug}`;

    const draft = {
      ...mockRustLesson,
      id: lessonId, // Stable ID
      title: `Mastering ${brief.topic}`,
      topic: brief.topic,
      description: `Generated lesson for ${brief.topic}`,
      provenance: {
        generatorModel: "mock-llm-v1",
        promptBundleVersion: "v1.0.0"
      }
    };
    return this.simulateStep(draft, LessonSpecSchema, this.delay);
  }

  async validateLesson(lesson: LessonSpec): Promise<ValidationReport> {
    // DETERMINISTIC VALIDATION: No random failures.
    // Check for actual missing fields or structural issues (mock logic)
    
    const warnings: string[] = [];
    if (lesson.stages.do.blocks.length === 0) {
      warnings.push("Do stage is empty");
    }
    
    // For mock purposes, we'll say it's always valid unless empty
    const report = {
      isValid: true,
      errors: [],
      warnings: warnings,
      citationCoverage: 1.0
    };
    return this.simulateStep(report, ValidationReportSchema, this.delay);
  }

  async packageLessonVersion(lesson: LessonSpec, runId: string): Promise<LessonVersion> {
    const versionId = `ver-${Date.now()}`;
    
    const version = {
      id: versionId,
      lessonId: lesson.id,
      spec: lesson,
      compilerRunId: runId,
      createdAt: new Date().toISOString(),
      sourceProvider: "mock_llm" as const,
      refreshPolicyDays: 90,
      staleAfter: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const validVersion = await this.simulateStep(version, LessonVersionSchema, this.delay);
    
    // PERSISTENCE: Save to store
    lessonStore.saveVersion(validVersion);
    lessonStore.publishVersion(lesson.id, versionId);
    
    return validVersion;
  }
}
