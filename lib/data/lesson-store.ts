import {
  CompilerRun,
  LessonVersion,
  CompilerRunSchema,
  LessonVersionSchema
} from "../contracts/compiler";
import { computeSpecHash } from "./spec-hash";

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

  /**
   * Saves a LessonVersion with automatic specHash stamping and immutability check.
   *
   * - If the versionId is NEW: compute specHash, set generatedAt, save.
   * - If the versionId EXISTS:
   *   - Same specHash (or only publishedAt differs): idempotent, allow.
   *   - Different specHash (content changed): throw ImmutabilityError.
   */
  saveVersion(version: LessonVersion) {
    // Compute specHash deterministically before validation
    const incomingHash = computeSpecHash(version.spec);

    // Stamp specHash and generatedAt onto the version
    const stamped: LessonVersion = {
      ...version,
      specHash: incomingHash,
      generatedAt: version.generatedAt ?? version.createdAt,
    };

    const validVersion = LessonVersionSchema.parse(stamped);

    const existing = this.versions.find(v => v.id === validVersion.id);
    if (existing) {
      // Immutability check: same versionId with different content → reject
      if (existing.specHash && existing.specHash !== validVersion.specHash) {
        throw new Error(
          `ImmutabilityError: LessonVersion '${validVersion.id}' already exists with a different specHash. ` +
          `Existing: ${existing.specHash}, Incoming: ${validVersion.specHash}. ` +
          `Version IDs are immutable — use a new versionId for updated content.`
        );
      }
      // Same content or metadata-only change (e.g. publishedAt): idempotent update
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

  /**
   * Returns all versions for a given lessonId, sorted newest-first by createdAt.
   */
  getVersionHistory(lessonId: string): LessonVersion[] {
    return this.versions
      .filter(v => v.lessonId === lessonId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  publishVersion(lessonId: string, versionId: string) {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);
    if (version.lessonId !== lessonId) throw new Error("Version mismatch");

    this.published[lessonId] = versionId;

    // Mark as published
    version.publishedAt = new Date().toISOString();
    this.saveVersion(version);

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
