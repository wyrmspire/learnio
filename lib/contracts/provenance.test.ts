import { describe, it, expect } from "vitest";
import { LessonVersionSchema } from "./compiler";
import { MockContentCompiler } from "../data/mock-compiler";
import { LessonStore } from "../data/lesson-store";
import { mockRustLesson } from "../data/mock-lessons";
import { SkillLoader } from "../skills/loader";

// We extract a fresh store to avoid dirtying singletons in tests
// Actually lesson-store exports `lessonStore` (singleton). 
// Let's create a quick clean one in tests.
class TestLessonStore extends (await import("../data/lesson-store")).lessonStore.constructor { }

// Mock localStorage for node environment
if (typeof global !== "undefined" && !global.localStorage) {
    (global as any).localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { }
    };
}

describe("Provenance End-to-End Verification", () => {
    it("LessonVersionSchema rejects missing sourceProvider", () => {
        const invalidVersion = {
            id: "ver-1",
            lessonId: "lesson-1",
            spec: mockRustLesson,
            compilerRunId: "run-1",
            createdAt: new Date().toISOString(),
            // MISSING sourceProvider
        };

        const result = LessonVersionSchema.safeParse(invalidVersion);
        expect(result.success).toBe(false);
        if (!result.success) {
            const errorMsg = result.error.issues.map(e => e.path.join(".") + ": " + e.message).join(", ");
            expect(errorMsg).toContain("sourceProvider");
        }
    });

    it("MockContentCompiler assigns mock_llm sourceProvider and computes valid staleAfter limits", async () => {
        const mockCompiler = new MockContentCompiler();
        // Use an un-simulated or fast delay mock if possible, otherwise we await normally
        // The lesson generation flow:
        const brief = await mockCompiler.generateResearchBrief("Rust Basics");
        const skeleton = await mockCompiler.generateSkeleton(brief);
        const draft = await mockCompiler.authorBlocks(skeleton, brief);
        const runId = "test-run";

        const version = await mockCompiler.packageLessonVersion(draft, runId);

        expect(version.sourceProvider).toBe("mock_llm");
        expect(version.refreshPolicyDays).toBe(90);

        // Validate staleAfter is ~90 days in the future
        const now = Date.now();
        const staleTime = new Date(version.staleAfter || "").getTime();
        const diffDays = (staleTime - now) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeCloseTo(90, 0); // within tolerance
    });

    it("LessonStore.seed assigns manual_seed and 365-day refresh", async () => {
        // We import the lessonStore class instance to test seeding behavior locally
        const { lessonStore: testStore } = await import("../data/lesson-store");

        // Mock window to bypass SSR guard in seed()
        const originalWindow = (global as any).window;
        (global as any).window = {};

        // Seed test lesson
        const testLesson = { ...mockRustLesson, id: "test-seed-lesson-123" };
        testStore.seed([testLesson]);

        if (originalWindow === undefined) {
            delete (global as any).window;
        } else {
            (global as any).window = originalWindow;
        }
        const seededVer = testStore.getPublishedVersion(testLesson.id);
        expect(seededVer).toBeDefined();
        expect(seededVer?.sourceProvider).toBe("manual_seed");
        expect(seededVer?.refreshPolicyDays).toBe(365);

        const now = Date.now();
        const staleTime = new Date(seededVer?.staleAfter || "").getTime();
        const diffDays = (staleTime - now) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeCloseTo(365, 0);
    });

    it("SkillLoader.installSkill overrides or sets manual_seed for newly bundled topics", async () => {
        const { skillLoader } = await import("../skills/loader");
        const { lessonStore } = await import("../data/lesson-store");

        // Install mock skill
        await skillLoader.installSkill("skill-ai-eng");

        // Grab one of the loaded mock lessons
        const ver = lessonStore.getPublishedVersion("lesson-ai-evals"); // this is hardcoded in loader.ts MOCK_COURSES
        expect(ver).toBeDefined();
        if (ver) {
            expect(ver.sourceProvider).toBe("manual_seed");
            expect(ver.refreshPolicyDays).toBe(365);
        }
    });

    it("saving un-populated generatedAt defaults to createdAt", async () => {
        const { lessonStore: testStore } = await import("../data/lesson-store");

        const createdDate = new Date("2020-01-01T00:00:00Z").toISOString();
        const testVer = {
            id: "ver-genat-test",
            lessonId: "test-gen",
            spec: mockRustLesson,
            compilerRunId: "test-run",
            sourceProvider: "manual_seed" as const,
            refreshPolicyDays: 1,
            createdAt: createdDate,
            // intentionally omit generatedAt
        };

        testStore.saveVersion(testVer);
        const retrieved = testStore.getVersion("ver-genat-test");

        expect(retrieved).toBeDefined();
        expect(retrieved?.generatedAt).toBe(createdDate); // Must default to createdAt
    });
});
