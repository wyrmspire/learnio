import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocalIndexSearchProvider } from "./local-search";
import { lessonStore } from "../data/lesson-store";
import { LessonSpec } from "../contracts/lesson";
import { mockRustLesson } from "../data/mock-lessons";

describe("LocalIndexSearchProvider", () => {
    beforeEach(() => {
        // Clear all spies before each run
        vi.restoreAllMocks();
    });

    it("returns empty array for empty queries", async () => {
        const provider = new LocalIndexSearchProvider();
        const results = await provider.search("   ");
        expect(results.length).toBe(0);
    });

    it("finds matches in title/topic and description", async () => {
        vi.spyOn(lessonStore, "getAllPublishedLessons").mockReturnValue([
            {
                id: "v1",
                lessonId: mockRustLesson.id,
                spec: mockRustLesson,
                compilerRunId: "test-run",
                createdAt: new Date().toISOString(),
                publishedAt: new Date().toISOString(),
                sourceProvider: "manual_seed",
                refreshPolicyDays: 90
            }
        ]);

        const provider = new LocalIndexSearchProvider();

        // "Rust" exists in title and topic strings of mockRustLesson
        const results = await provider.search("Rust");
        expect(results.length).toBe(1);
        expect(results[0].lessonId).toBe(mockRustLesson.id);
        expect(results[0].score).toBeGreaterThan(0);
        expect(results[0].snippet).toBe(mockRustLesson.description);
    });

    it("finds matches in block content (markdown, prompts)", async () => {
        vi.spyOn(lessonStore, "getAllPublishedLessons").mockReturnValue([
            {
                id: "v1",
                lessonId: mockRustLesson.id,
                spec: mockRustLesson,
                compilerRunId: "test-run",
                createdAt: "",
                sourceProvider: "manual_seed",
                refreshPolicyDays: 90
            }
        ]);

        const provider = new LocalIndexSearchProvider();

        // "garbage" is mentioned inside the block-plan-1 markdown in mockRustLesson
        const results = await provider.search("garbage");
        expect(results.length).toBe(1);
        expect(results[0].score).toBeGreaterThan(0);
    });

    it("returns empty for completely non-matching queries", async () => {
        vi.spyOn(lessonStore, "getAllPublishedLessons").mockReturnValue([
            {
                id: "v1",
                lessonId: mockRustLesson.id,
                spec: mockRustLesson,
                compilerRunId: "test-run",
                createdAt: "",
                sourceProvider: "manual_seed",
                refreshPolicyDays: 90
            }
        ]);

        const provider = new LocalIndexSearchProvider();
        const results = await provider.search("xylophone");
        expect(results.length).toBe(0);
    });

    it("respects limits and sorts by score", async () => {
        const mockPythonLesson: LessonSpec = {
            ...mockRustLesson,
            id: "python-1",
            title: "Python Basics",
            topic: "Python",
            description: "Learn Python",
            stages: { plan: { blocks: [] }, do: { blocks: [] }, check: { blocks: [] }, act: { blocks: [] } }
        } as any;

        vi.spyOn(lessonStore, "getAllPublishedLessons").mockReturnValue([
            { id: "v1", lessonId: mockRustLesson.id, spec: mockRustLesson, compilerRunId: "test", createdAt: "", sourceProvider: "manual_seed", refreshPolicyDays: 90 },
            { id: "v2", lessonId: mockPythonLesson.id, spec: mockPythonLesson, compilerRunId: "test", createdAt: "", sourceProvider: "manual_seed", refreshPolicyDays: 90 }
        ]);

        const provider = new LocalIndexSearchProvider();

        // "Rust Python" matches both, but mockRustLesson should score higher since it has more hits for Rust than Python does for Python
        const results = await provider.search("Rust Python");

        expect(results.length).toBe(2);
        // mockRustLesson should be first
        expect(results[0].lessonId).toBe(mockRustLesson.id);

        const limited = await provider.search("Rust Python", 1);
        expect(limited.length).toBe(1);
        expect(limited[0].lessonId).toBe(mockRustLesson.id);
    });
});
