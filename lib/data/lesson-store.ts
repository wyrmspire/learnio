import { 
  CompilerRun, 
  LessonVersion, 
  CompilerRunSchema, 
  LessonVersionSchema 
} from "../contracts/compiler";

/**
 * LESSON STORE
 * 
 * A minimal, local-first store for content artifacts.
 * This simulates the DB layer for the Content Factory.
 */
class LessonStore {
  private readonly RUNS_KEY = "learnio_compiler_runs";
  private readonly VERSIONS_KEY = "learnio_lesson_versions";
  private readonly PUBLISHED_KEY = "learnio_published_pointers";

  private runs: CompilerRun[] = [];
  private versions: LessonVersion[] = [];
  private published: Record<string, string> = {}; // lessonId -> versionId

  constructor() {
    if (typeof window !== "undefined") {
      this.hydrate();
    }
  }

  private hydrate() {
    try {
      const runs = localStorage.getItem(this.RUNS_KEY);
      const versions = localStorage.getItem(this.VERSIONS_KEY);
      const published = localStorage.getItem(this.PUBLISHED_KEY);

      if (runs) this.runs = JSON.parse(runs);
      if (versions) this.versions = JSON.parse(versions);
      if (published) this.published = JSON.parse(published);
    } catch (e) {
      console.error("Failed to hydrate LessonStore", e);
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.RUNS_KEY, JSON.stringify(this.runs));
      localStorage.setItem(this.VERSIONS_KEY, JSON.stringify(this.versions));
      localStorage.setItem(this.PUBLISHED_KEY, JSON.stringify(this.published));
    } catch (e) {
      console.error("Failed to persist LessonStore", e);
    }
  }

  // --- Runs ---

  saveRun(run: CompilerRun) {
    // Validate schema before saving
    const validRun = CompilerRunSchema.parse(run);
    
    const existingIdx = this.runs.findIndex(r => r.id === validRun.id);
    if (existingIdx >= 0) {
      this.runs[existingIdx] = validRun;
    } else {
      this.runs.push(validRun);
    }
    this.persist();
  }

  getRuns(): CompilerRun[] {
    return [...this.runs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getRun(id: string): CompilerRun | undefined {
    return this.runs.find(r => r.id === id);
  }

  // --- Versions ---

  saveVersion(version: LessonVersion) {
    const validVersion = LessonVersionSchema.parse(version);
    
    // Enforce Immutability: Check if version ID already exists
    const existing = this.versions.find(v => v.id === validVersion.id);
    if (existing) {
      // Allow updating ONLY if it's the exact same object (idempotent) or adding publishedAt
      // But strictly speaking, versions should be immutable.
      // For now, we'll allow overwriting if it's just updating metadata like publishedAt, 
      // but in a real system this would be stricter.
      const index = this.versions.indexOf(existing);
      this.versions[index] = validVersion;
    } else {
      this.versions.push(validVersion);
    }
    this.persist();
  }

  getVersion(versionId: string): LessonVersion | undefined {
    return this.versions.find(v => v.id === versionId);
  }

  publishVersion(lessonId: string, versionId: string) {
    // Verify version exists
    const version = this.versions.find(v => v.id === versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);
    if (version.lessonId !== lessonId) throw new Error("Version mismatch");

    this.published[lessonId] = versionId;
    
    // Update the version object to mark as published
    version.publishedAt = new Date().toISOString();
    this.saveVersion(version); // Re-save with publishedAt
    
    this.persist();
  }

  getPublishedVersion(lessonId: string): LessonVersion | undefined {
    const versionId = this.published[lessonId];
    if (!versionId) return undefined;
    return this.versions.find(v => v.id === versionId);
  }
  
  getAllPublishedLessons(): LessonVersion[] {
    return Object.values(this.published)
      .map(vid => this.versions.find(v => v.id === vid))
      .filter((v): v is LessonVersion => !!v);
  }

  seed(lessons: import("../contracts/lesson").LessonSpec[]) {
    if (typeof window === "undefined") return;
    
    let seededCount = 0;
    lessons.forEach(lesson => {
      // Check if already published
      if (this.published[lesson.id]) return;

      const versionId = `ver-seed-${lesson.id}`;
      const version: LessonVersion = {
        id: versionId,
        lessonId: lesson.id,
        spec: lesson,
        compilerRunId: "seed-run",
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        sourceProvider: "manual_seed",
        refreshPolicyDays: 365,
        staleAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      this.saveVersion(version);
      this.publishVersion(lesson.id, versionId);
      seededCount++;
    });
    
    if (seededCount > 0) {
      console.log(`[LessonStore] Seeded ${seededCount} lessons.`);
    }
  }
}

export const lessonStore = new LessonStore();
