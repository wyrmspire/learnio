import {
  SkillRegistry,
  SkillManifest,
  CourseManifest,
  SkillRegistrySchema,
  SkillManifestSchema,
  CourseManifestSchema
} from "../contracts/skills";
import { LessonSpec, LessonSpecSchema } from "../contracts/lesson";
import { lessonStore } from "../data/lesson-store";
import { validateBundle } from "./validator";

// --- Mock File System ---
// In a real app, this would read from /skills/*.json
// For now, we simulate the file structure in memory.

const MOCK_REGISTRY: SkillRegistry = {
  skills: [
    { id: "skill-ai-eng", path: "ai-engineering", version: "1.0.0" }
  ]
};

const MOCK_SKILLS: Record<string, SkillManifest> = {
  "skill-ai-eng": {
    id: "skill-ai-eng",
    name: "AI Engineering Fundamentals",
    description: "Core concepts for building reliable AI systems.",
    version: "1.0.0",
    tags: ["ai", "engineering", "evals"],
    branches: [
      { intent: "learn evals", targetCourseId: "course-ai-evals" }
    ]
  }
};

const MOCK_COURSES: Record<string, CourseManifest> = {
  "course-ai-evals": {
    id: "course-ai-evals",
    skillId: "skill-ai-eng",
    title: "Reliable AI Systems",
    description: "From vibes to metrics.",
    lessonOrder: ["lesson-ai-evals", "lesson-rag-patterns", "lesson-tool-use"]
  }
};

// We reuse the seed curriculum as the lesson content
import { seedCurriculum } from "../data/seed-curriculum";

export class SkillLoader {

  async loadRegistry(): Promise<SkillRegistry> {
    // Validate schema at boundary
    return SkillRegistrySchema.parse(MOCK_REGISTRY);
  }

  async loadSkillManifest(skillId: string): Promise<SkillManifest> {
    const manifest = MOCK_SKILLS[skillId];
    if (!manifest) throw new Error(`Skill ${skillId} not found`);
    return SkillManifestSchema.parse(manifest);
  }

  async loadCourse(courseId: string): Promise<CourseManifest> {
    const course = MOCK_COURSES[courseId];
    if (!course) throw new Error(`Course ${courseId} not found`);
    return CourseManifestSchema.parse(course);
  }

  async loadLesson(lessonId: string): Promise<LessonSpec> {
    const lesson = seedCurriculum.find(l => l.id === lessonId);
    if (!lesson) throw new Error(`Lesson ${lessonId} not found in seed content`);
    return LessonSpecSchema.parse(lesson);
  }

  /**
   * Ingests a full skill bundle into the LessonStore (mock DB).
   * This effectively "installs" the skill.
   */
  async installSkill(skillId: string) {
    console.log(`[SkillLoader] Installing skill: ${skillId}...`);

    // We get the raw manifest, course and lessons
    const manifestRaw = MOCK_SKILLS[skillId];
    if (!manifestRaw) throw new Error(`Skill ${skillId} not found`);

    const coursesRaw = Object.values(MOCK_COURSES).filter(c => c.skillId === skillId);

    const lessonsRaw: unknown[] = [];
    for (const c of coursesRaw) {
      for (const lessonId of c.lessonOrder) {
        const l = seedCurriculum.find(l => l.id === lessonId);
        if (l) lessonsRaw.push(l);
      }
    }

    // Validate the bundle before ingestion
    const validation = validateBundle([manifestRaw], coursesRaw, lessonsRaw);
    if (validation.errors.length > 0) {
      throw new Error(`Failed to install skill ${skillId}:\n` + validation.errors.join("\n"));
    }

    const manifest = await this.loadSkillManifest(skillId);

    // Find all courses for this skill
    const courseIds = Object.values(MOCK_COURSES)
      .filter(c => c.skillId === skillId)
      .map(c => c.id);

    for (const courseId of courseIds) {
      const course = await this.loadCourse(courseId);
      console.log(`[SkillLoader] Installing course: ${course.title}`);

      for (const lessonId of course.lessonOrder) {
        const lesson = await this.loadLesson(lessonId);

        // Use the store's existing logic to save/publish
        // We simulate a "seed run" for provenance
        const versionId = `ver-${lesson.id}-${lesson.version}`;

        // Check if already installed to avoid dupes
        if (lessonStore.getPublishedVersion(lesson.id)) {
          console.log(`[SkillLoader] Lesson ${lesson.id} already installed. Skipping.`);
          continue;
        }

        const version: import("../contracts/compiler").LessonVersion = {
          id: versionId,
          lessonId: lesson.id,
          spec: lesson,
          compilerRunId: "install-run",
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          sourceProvider: "manual_seed",
          refreshPolicyDays: 365,
          staleAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        lessonStore.saveVersion(version);
        lessonStore.publishVersion(lesson.id, versionId);
        console.log(`[SkillLoader] Installed lesson: ${lesson.title}`);
      }
    }

    console.log(`[SkillLoader] Skill ${skillId} installation complete.`);
  }
}

export const skillLoader = new SkillLoader();
