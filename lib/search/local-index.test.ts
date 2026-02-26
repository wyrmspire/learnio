import { describe, it, expect, beforeEach } from "vitest";
import { LocalIndexSearchProvider } from "./local-index";
import { lessonStore } from "../data/lesson-store";
import { LessonSpec } from "../contracts/lesson";

const MOCK_LESSON_1: LessonSpec = {
    id: "l1",
    version: "1.0",
    schemaVersion: "1.0.0",
    title: "Understanding Determinism",
    topic: "Determinism",
    description: "Learn how to make code pure.",
    difficulty: "intermediate",
    estimatedDuration: 10,
    tags: ["pure"],
    capabilityIds: [],
    cuIds: [],
    stages: {
        plan: { blocks: [] },
        do: { blocks: [{ id: "b1", type: "todo", text: "Avoid Math.random() in projectors." }] },
        check: { blocks: [] },
        act: { blocks: [] }
    }
};

const MOCK_LESSON_2: LessonSpec = {
    id: "l2",
    version: "1.0",
    schemaVersion: "1.0.0",
    title: "Event Sourcing Basics",
    topic: "Data Architecture",
    description: "Storing changes as events.",
    difficulty: "beginner",
    estimatedDuration: 15,
    tags: ["events"],
    capabilityIds: [],
    cuIds: [],
    stages: {
        plan: { blocks: [] },
        do: { blocks: [{ id: "b2", type: "todo", text: "Append-only logs are deterministic." }] },
        check: { blocks: [] },
        act: { blocks: [] }
    }
};

import { LessonVersion } from "../contracts/compiler";

describe("LocalIndexSearchProvider", () => {
    let provider: LocalIndexSearchProvider;

    beforeEach(() => {
        // We use the existing store as the index target
        // lessonStore.seed is a no-op in Node, so we save/publish manually
        const v1: LessonVersion = {
            id: "ver-l1", lessonId: MOCK_LESSON_1.id, spec: MOCK_LESSON_1,
            compilerRunId: "test", createdAt: new Date().toISOString(),
            sourceProvider: "manual_seed", refreshPolicyDays: 365, staleAfter: ""
        };
        const v2: LessonVersion = {
            id: "ver-l2", lessonId: MOCK_LESSON_2.id, spec: MOCK_LESSON_2,
            compilerRunId: "test", createdAt: new Date().toISOString(),
            sourceProvider: "manual_seed", refreshPolicyDays: 365, staleAfter: ""
        };
        lessonStore.saveVersion(v1);
        lessonStore.publishVersion(MOCK_LESSON_1.id, v1.id);
        lessonStore.saveVersion(v2);
        lessonStore.publishVersion(MOCK_LESSON_2.id, v2.id);

        provider = new LocalIndexSearchProvider();
    });

    it("returns empty array for empty query", async () => {
        const results = await provider.search("");
        expect(results).toEqual([]);
    });

    it("finds exact matches in title with highest score", async () => {
        const results = await provider.search("determin");
        expect(results).toHaveLength(2); // Matches l1 title/topic/blocks AND l2 block ("deterministic")

        const l1Result = results.find(r => r.lessonId === "l1");
        const l2Result = results.find(r => r.lessonId === "l2");

        expect(l1Result).toBeDefined();
        expect(l2Result).toBeDefined();

        // l1 should have higher score because of Title + Topic match
        expect(l1Result!.score).toBeGreaterThan(l2Result!.score);
    });

    it("generates a snippet from block text", async () => {
        const results = await provider.search("Math.random");
        expect(results).toHaveLength(1);
        expect(results[0].lessonId).toBe("l1");
        expect(results[0].snippet).toContain("Avoid Math.random() in projectors");
    });

    it("respects the limit parameter", async () => {
        const results = await provider.search("e", 1); // Matches multiple
        expect(results).toHaveLength(1);
    });
});
