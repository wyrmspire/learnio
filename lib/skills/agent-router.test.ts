import { describe, it, expect, vi } from "vitest";
import { AgentRouter, RouterContext } from "./agent-router";
import { CourseProgress } from "../events/read-models";
import { SearchProvider, SearchResult } from "../contracts/search";
import { AbilityDefinition } from "./ability";
import { MOCK_ABILITIES } from "./ability";

// ---------------------------------------------------------------------------
// F3 · Agent Router Tests
// ---------------------------------------------------------------------------

// --- Mock Search Provider ---

function makeSearchProvider(results: SearchResult[] = []): SearchProvider {
    return {
        search: vi.fn().mockResolvedValue(results),
    };
}

// --- Fixtures ---

const SKILL_AI_ENG_ABILITY = MOCK_ABILITIES["skill-ai-eng"];

function makeCourseProgress(overrides: Partial<CourseProgress> = {}): CourseProgress {
    return {
        courseId: "course-ai-evals",
        percentComplete: 0,
        currentLessonId: "lesson-ai-evals",
        nextLessonId: "lesson-rag-patterns",
        completedLessonIds: [],
        startedAt: "",
        lastActivityAt: "",
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AgentRouter.route()", () => {
    it("returns null for empty query", async () => {
        const router = new AgentRouter(makeSearchProvider());
        const result = await router.route({
            query: "",
            courseProgressMap: new Map(),
            abilities: [SKILL_AI_ENG_ABILITY],
        });
        expect(result).toBeNull();
    });

    it("returns null for no abilities", async () => {
        const router = new AgentRouter(makeSearchProvider());
        const result = await router.route({
            query: "learn evals",
            courseProgressMap: new Map(),
            abilities: [],
        });
        expect(result).toBeNull();
    });

    it("routes 'learn evals' to course-ai-evals", async () => {
        const router = new AgentRouter(makeSearchProvider());
        const ctx: RouterContext = {
            query: "learn evals",
            courseProgressMap: new Map([["course-ai-evals", makeCourseProgress()]]),
            abilities: [SKILL_AI_ENG_ABILITY],
        };
        const result = await router.route(ctx);
        expect(result).not.toBeNull();
        expect(result!.courseId).toBe("course-ai-evals");
    });

    it("returns currentLessonId as lessonId when course is in progress", async () => {
        const router = new AgentRouter(makeSearchProvider());
        const progress = makeCourseProgress({
            curren: "lesson-rag-patterns",
            completedLessonIds: ["lesson-ai-evals"],
            percentComplete: 33,
        } as any);
        progress.currentLessonId = "lesson-rag-patterns";

        const ctx: RouterContext = {
            query: "eval metric",
            courseProgressMap: new Map([["course-ai-evals", progress]]),
            abilities: [SKILL_AI_ENG_ABILITY],
        };
        const result = await router.route(ctx);
        expect(result).not.toBeNull();
        expect(result!.lessonId).toBe("lesson-rag-patterns");
    });

    it("skips 100%-complete course and picks next best branch", async () => {
        // Make the primary course complete
        const completedProgress = makeCourseProgress({ percentComplete: 100, currentLessonId: null });

        // Add a second ability pointing to a different course
        const secondAbility: AbilityDefinition = {
            ...SKILL_AI_ENG_ABILITY,
            skillId: "skill-advanced-ai",
            name: "Advanced AI",
            description: "Advanced AI course.",
            branches: [
                {
                    intent: "learn evals",
                    targetCourseId: "course-advanced-evals",
                    keywords: ["eval", "advanced"],
                },
            ],
        };
        const advancedProgress = makeCourseProgress({ courseId: "course-advanced-evals", currentLessonId: "lesson-adv-1" });

        const router = new AgentRouter(makeSearchProvider());
        const ctx: RouterContext = {
            query: "learn evals",
            courseProgressMap: new Map([
                ["course-ai-evals", completedProgress],
                ["course-advanced-evals", advancedProgress],
            ]),
            abilities: [SKILL_AI_ENG_ABILITY, secondAbility],
        };
        const result = await router.route(ctx);
        expect(result).not.toBeNull();
        // Should fall back to course-advanced-evals since course-ai-evals is done
        expect(result!.courseId).toBe("course-advanced-evals");
    });

    it("boosts confidence when search hit aligns with branch", async () => {
        const searchResult: SearchResult = {
            lessonId: "lesson-ai-evals",
            versionId: "ver-seed-lesson-ai-evals",
            title: "Designing Deterministic Evals",
            topic: "AI Engineering",
            snippet: "...metric-driven engineering...",
            score: 10,
        };
        const router = new AgentRouter(makeSearchProvider([searchResult]));
        const ctx: RouterContext = {
            query: "eval metric scoring",
            courseProgressMap: new Map([["course-ai-evals", makeCourseProgress()]]),
            abilities: [SKILL_AI_ENG_ABILITY],
        };
        const base = new AgentRouter(makeSearchProvider());
        const baseResult = await base.route({ ...ctx });
        const boosted = await router.route(ctx);

        expect(boosted!.confidence).toBeGreaterThanOrEqual(baseResult!.confidence);
    });

    it("falls back to search-only recommendation when no branch matches", async () => {
        const searchResult: SearchResult = {
            lessonId: "lesson-unknown-topic",
            versionId: "ver-unknown",
            title: "Obscure Topic",
            topic: "Mystery",
            snippet: "Something niche",
            score: 3,
        };
        const router = new AgentRouter(makeSearchProvider([searchResult]));
        const ctx: RouterContext = {
            query: "something completely unrelated xyzq",
            courseProgressMap: new Map(),
            abilities: [SKILL_AI_ENG_ABILITY],
        };
        const result = await router.route(ctx);
        // A fallback should still be returned with the search hit
        expect(result).not.toBeNull();
        expect(result!.searchHit?.lessonId).toBe("lesson-unknown-topic");
    });

    it("returns null when no branch matches and search is empty", async () => {
        const router = new AgentRouter(makeSearchProvider([]));
        const ctx: RouterContext = {
            query: "xyzzy zork frobnicate",
            courseProgressMap: new Map(),
            abilities: [SKILL_AI_ENG_ABILITY],
        };
        const result = await router.route(ctx);
        expect(result).toBeNull();
    });

    it("recommendation includes matched branch and rationale", async () => {
        const router = new AgentRouter(makeSearchProvider());
        const ctx: RouterContext = {
            query: "tool use function calling",
            courseProgressMap: new Map([["course-ai-evals", makeCourseProgress()]]),
            abilities: [SKILL_AI_ENG_ABILITY],
        };
        const result = await router.route(ctx);
        expect(result).not.toBeNull();
        expect(result!.matchedBranch).not.toBeNull();
        expect(result!.rationale).toBeTruthy();
    });

    it("confidence is between 0 and 1", async () => {
        const router = new AgentRouter(makeSearchProvider());
        const ctx: RouterContext = {
            query: "rag retrieval vector hybrid search",
            courseProgressMap: new Map([["course-ai-evals", makeCourseProgress()]]),
            abilities: [SKILL_AI_ENG_ABILITY],
        };
        const result = await router.route(ctx);
        if (result) {
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        }
    });
});
