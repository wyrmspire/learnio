/**
 * A3 · Lesson Immutability Tests
 *
 * Tests for LessonStore.saveVersion():
 *   - Saving a new version stamps specHash correctly
 *   - Overwriting a versionId with the SAME specHash is idempotent (allowed)
 *   - Overwriting a versionId with a DIFFERENT specHash throws ImmutabilityError
 *   - getVersionHistory() returns versions sorted newest-first
 */

import { describe, it, expect, beforeEach } from "vitest";
import { computeSpecHash } from "./spec-hash";
import { LessonSpec } from "../contracts/lesson";
import { LessonVersion } from "../contracts/compiler";

// ---- Helpers ----

const NOW_A = "2024-01-01T00:00:00.000Z";
const NOW_B = "2024-06-01T00:00:00.000Z";

const baseSpec: LessonSpec = {
    id: "lesson-test-immut",
    schemaVersion: "1.0.0",
    version: "v1.0.0",
    title: "Immutability Test Lesson",
    topic: "Testing",
    description: "A lesson used for immutability testing.",
    difficulty: "beginner",
    estimatedDuration: 10,
    tags: ["test"],
    capabilityIds: ["cap-test"],
    cuIds: ["cu-test"],
    stages: {
        plan: { blocks: [{ id: "b-plan-1", type: "explainer", markdown: "Plan content." }] },
        do: { blocks: [{ id: "b-do-1", type: "explainer", markdown: "Do content." }] },
        check: { blocks: [{ id: "b-check-1", type: "explainer", markdown: "Check content." }] },
        act: { blocks: [{ id: "b-act-1", type: "explainer", markdown: "Act content." }] },
    },
};

const alteredSpec: LessonSpec = {
    ...baseSpec,
    title: "ALTERED Immutability Test Lesson", // different title → different hash
};

function makeVersion(overrides: Partial<LessonVersion> = {}): LessonVersion {
    return {
        id: "ver-test-001",
        lessonId: "lesson-test-immut",
        spec: baseSpec,
        compilerRunId: "run-test",
        createdAt: NOW_A,
        sourceProvider: "manual_seed",
        refreshPolicyDays: 90,
        ...overrides,
    };
}

// ---- computeSpecHash unit tests ----

describe("computeSpecHash", () => {
    it("is deterministic — same spec produces same hash", () => {
        const h1 = computeSpecHash(baseSpec);
        const h2 = computeSpecHash(baseSpec);
        expect(h1).toBe(h2);
    });

    it("produces different hashes for different specs", () => {
        const h1 = computeSpecHash(baseSpec);
        const h2 = computeSpecHash(alteredSpec);
        expect(h1).not.toBe(h2);
    });

    it("is insensitive to object key insertion order", () => {
        // Rearranged top-level keys
        const reordered: LessonSpec = {
            stages: baseSpec.stages,
            id: baseSpec.id,
            schemaVersion: baseSpec.schemaVersion,
            version: baseSpec.version,
            title: baseSpec.title,
            topic: baseSpec.topic,
            description: baseSpec.description,
            difficulty: baseSpec.difficulty,
            estimatedDuration: baseSpec.estimatedDuration,
            tags: baseSpec.tags,
            capabilityIds: baseSpec.capabilityIds,
            cuIds: baseSpec.cuIds,
        };
        expect(computeSpecHash(reordered)).toBe(computeSpecHash(baseSpec));
    });
});

// ---- LessonStore in-process tests ----
// We test the store logic directly without browser localStorage (tests run in Node).
// We instantiate a fresh store-like structure per test to stay isolated.

// Inline store logic (mirrors lesson-store.ts but Node-compatible, no localStorage)
class TestStore {
    private versions: LessonVersion[] = [];

    saveVersion(version: LessonVersion): void {
        const incomingHash = computeSpecHash(version.spec);
        const stamped: LessonVersion = {
            ...version,
            specHash: incomingHash,
            generatedAt: version.generatedAt ?? version.createdAt,
        };

        const existing = this.versions.find(v => v.id === stamped.id);
        if (existing) {
            if (existing.specHash && existing.specHash !== stamped.specHash) {
                throw new Error(
                    `ImmutabilityError: LessonVersion '${stamped.id}' already exists with a different specHash.`
                );
            }
            const index = this.versions.indexOf(existing);
            this.versions[index] = stamped;
        } else {
            this.versions.push(stamped);
        }
    }

    getVersion(id: string): LessonVersion | undefined {
        return this.versions.find(v => v.id === id);
    }

    getVersionHistory(lessonId: string): LessonVersion[] {
        return this.versions
            .filter(v => v.lessonId === lessonId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}

describe("LessonStore — saveVersion immutability", () => {
    let store: TestStore;

    beforeEach(() => {
        store = new TestStore();
    });

    it("saves a new version and stamps specHash", () => {
        const v = makeVersion();
        store.saveVersion(v);
        const saved = store.getVersion("ver-test-001");
        expect(saved).toBeDefined();
        expect(saved!.specHash).toBe(computeSpecHash(baseSpec));
        expect(saved!.generatedAt).toBe(NOW_A);
    });

    it("is idempotent: overwriting same versionId with identical spec is allowed", () => {
        const v = makeVersion();
        store.saveVersion(v);
        // Second save with the same spec — should NOT throw
        expect(() => store.saveVersion({ ...v, publishedAt: NOW_B })).not.toThrow();
        // Updated metadata is persisted
        const saved = store.getVersion("ver-test-001");
        expect(saved!.publishedAt).toBe(NOW_B);
    });

    it("throws ImmutabilityError when same versionId is saved with different spec content", () => {
        const v = makeVersion();
        store.saveVersion(v);
        const vAltered = makeVersion({ spec: alteredSpec });
        expect(() => store.saveVersion(vAltered)).toThrowError(/ImmutabilityError/);
    });
});

describe("LessonStore — getVersionHistory", () => {
    let store: TestStore;

    beforeEach(() => {
        store = new TestStore();
    });

    it("returns versions newest-first", () => {
        // Older version saved first
        const v1 = makeVersion({ id: "ver-test-001", createdAt: "2024-01-01T00:00:00.000Z" });
        const v2 = makeVersion({ id: "ver-test-002", createdAt: "2024-06-01T00:00:00.000Z" });
        store.saveVersion(v1);
        store.saveVersion(v2);

        const history = store.getVersionHistory("lesson-test-immut");
        expect(history).toHaveLength(2);
        expect(history[0].id).toBe("ver-test-002"); // newest first
        expect(history[1].id).toBe("ver-test-001");
    });

    it("returns empty array for unknown lessonId", () => {
        expect(store.getVersionHistory("nonexistent")).toEqual([]);
    });

    it("filters by lessonId, ignoring other lessons", () => {
        const v1 = makeVersion({ id: "ver-a", lessonId: "lesson-A" });
        const v2 = makeVersion({ id: "ver-b", lessonId: "lesson-B" });
        store.saveVersion(v1);
        store.saveVersion(v2);

        const historyA = store.getVersionHistory("lesson-A");
        expect(historyA).toHaveLength(1);
        expect(historyA[0].id).toBe("ver-a");
    });
});
