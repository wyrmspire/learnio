import { 
  ContentCompiler, 
  ResearchBrief, 
  LessonSkeleton, 
  ValidationReport, 
  LessonVersion 
} from "../contracts/compiler";
import { LessonSpec } from "../contracts/lesson";
import { mockRustLesson } from "./mock-lessons";

export class MockContentCompiler implements ContentCompiler {
  private delay = 800;

  async generateResearchBrief(topic: string): Promise<ResearchBrief> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
    return {
      topic,
      objectives: ["Understand core concepts", "Apply to problem", "Verify understanding"],
      misconceptions: ["Common error 1", "Common error 2"],
      keyTerms: ["Term A", "Term B"],
      sources: [
        { id: "src-1", title: "Official Documentation", url: "https://example.com" },
        { id: "src-2", title: "Community Guide", snippet: "Key insight here..." }
      ]
    };
  }

  async generateSkeleton(brief: ResearchBrief): Promise<LessonSkeleton> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
    return {
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
  }

  async authorBlocks(skeleton: LessonSkeleton, brief: ResearchBrief): Promise<LessonSpec> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
    return {
      ...mockRustLesson,
      id: `lesson-${Date.now()}`,
      title: `Mastering ${brief.topic}`,
      topic: brief.topic,
      description: `Generated lesson for ${brief.topic}`,
      provenance: {
        generatorModel: "mock-llm-v1",
        promptBundleVersion: "v1.0.0"
      }
    };
  }

  async validateLesson(lesson: LessonSpec): Promise<ValidationReport> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
    // Simulate random validation warning
    const hasWarning = Math.random() > 0.8;
    return {
      isValid: true,
      errors: [],
      warnings: hasWarning ? ["Citation coverage low in Do stage"] : [],
      citationCoverage: hasWarning ? 0.7 : 1.0
    };
  }

  async packageLessonVersion(lesson: LessonSpec, runId: string): Promise<LessonVersion> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
    return {
      id: `ver-${Date.now()}`,
      lessonId: lesson.id,
      spec: lesson,
      compilerRunId: runId,
      createdAt: new Date().toISOString()
    };
  }
}
