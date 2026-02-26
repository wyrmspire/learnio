/**
 * Unit tests for StagedContentCompiler (D1)
 *
 * Verifies that the staged pipeline:
 *   1. Yields exactly 5 distinct intermediate CompilerRun snapshots (one per phase).
 *   2. Each snapshot has the correct `phase` and transitions through `status` correctly.
 *   3. Final snapshot is `status: "completed"`.
 *   4. Artifacts accumulate across phases (brief → skeleton → blocks → validate).
 *   5. A failing compiler step yields a `status: "failed"` snapshot and stops.
 *   6. `runFull()` collects all snapshots and returns the correct final run.
 */

import { describe, it, expect, vi } from "vitest";
import { StagedContentCompiler } from "./staged-compiler";
import {
    ContentCompiler,
    ResearchBrief,
    LessonSkeleton,
    ValidationReport,
    LessonVersion,
    CompilerRun,
} from "../contracts/compiler";
import { mockRustLesson } from "./mock-lessons";

// ---------------------------------------------------------------------------
// Minimal fixture values that satisfy Zod schemas
// ---------------------------------------------------------------------------

const BRIEF: ResearchBrief = {
    topic: "Rust Ownership",
    objectives: ["Understand borrowing"],
    misconceptions: ["Ownership moves always copy"],
    keyTerms: ["borrow", "lifetime"],
    sources: [{ id: "s1", title: "Rust Book", url: "https://doc.rust-lang.org/book/" }],
};

const SKELETON: LessonSkeleton = {
    pdcaStructure: {
        plan: "Predict what happens when you move a value.",
        do: "Write code that borrows a value.",
        check: "Does the code compile? Why?",
        act: "Refactor to use references instead.",
    },
    blockOutline: [
        { stage: "plan", type: "explainer", goal: "Intro to ownership" },
        { stage: "do", type: "exercise", goal: "Practice borrow" },
    ],
};

// Use the valid full mockRustLesson fixture — DRAFT_LESSON must pass LessonSpecSchema
const DRAFT_LESSON = mockRustLesson;

const VALIDATION: ValidationReport = {
    isValid: true,
    errors: [],
    warnings: [],
    citationCoverage: 1.0,
};

const LESSON_VERSION: LessonVersion = {
    id: "ver-test-1",
    lessonId: "lesson-rust-ownership",
    spec: DRAFT_LESSON,
    compilerRunId: "run-test",
    createdAt: "2026-01-01T00:00:00.000Z",
    sourceProvider: "mock_llm",
    refreshPolicyDays: 90,
};

// ---------------------------------------------------------------------------
// Mock compiler factory
// ---------------------------------------------------------------------------

function makeMockCompiler(overrides: Partial<ContentCompiler> = {}): ContentCompiler {
    return {
        generateResearchBrief: vi.fn().mockResolvedValue(BRIEF),
        generateSkeleton: vi.fn().mockResolvedValue(SKELETON),
        authorBlocks: vi.fn().mockResolvedValue(DRAFT_LESSON),
        validateLesson: vi.fn().mockResolvedValue(VALIDATION),
        packageLessonVersion: vi.fn().mockResolvedValue(LESSON_VERSION),
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StagedContentCompiler", () => {
    describe("compile() — happy path", () => {
        it("yields exactly 10 intermediate snapshots (2 per phase × 5 phases)", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            const snapshots: CompilerRun[] = [];

            for await (const run of staged.compile("Rust Ownership")) {
                snapshots.push(run);
            }

            // Each phase yields 2 snapshots:
            //   1) phase set to X, status "running" (emitted before async call)
            //   2) phase still X, artifact populated (emitted after async call)
            // 5 phases × 2 = 10 total.
            expect(snapshots.length).toBe(10);
        });

        it("produces 5 distinct phases across the snapshots", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            const phases = new Set<string>();

            for await (const run of staged.compile("Rust Ownership")) {
                if (run.phase) phases.add(run.phase);
            }

            expect([...phases].sort()).toEqual(["blocks", "brief", "package", "skeleton", "validate"]);
        });

        it("final snapshot has status 'completed'", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            let lastRun: import("../contracts/compiler").CompilerRun | undefined;

            for await (const run of staged.compile("Rust Ownership")) {
                lastRun = run;
            }

            expect(lastRun?.status).toBe("completed");
            expect(lastRun?.phase).toBe("package");
        });

        it("brief artifact is populated after brief phase", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            const snapshots: import("../contracts/compiler").CompilerRun[] = [];

            for await (const run of staged.compile("Rust Ownership")) {
                snapshots.push(run);
            }

            // The snapshot after brief resolves should have the brief artifact
            const briefDoneSnapshot = snapshots.find(
                (s) => s.phase === "brief" && s.artifacts.brief !== undefined
            );
            expect(briefDoneSnapshot).toBeDefined();
            expect(briefDoneSnapshot?.artifacts.brief?.topic).toBe("Rust Ownership");
        });

        it("skeleton artifact is populated after skeleton phase", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            const snapshots: import("../contracts/compiler").CompilerRun[] = [];

            for await (const run of staged.compile("Rust Ownership")) {
                snapshots.push(run);
            }

            const skeletonDone = snapshots.find(
                (s) => s.phase === "skeleton" && s.artifacts.skeleton !== undefined
            );
            expect(skeletonDone).toBeDefined();
        });

        it("draftLesson artifact is populated after blocks phase", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            const snapshots: import("../contracts/compiler").CompilerRun[] = [];

            for await (const run of staged.compile("Rust Ownership")) {
                snapshots.push(run);
            }

            const blocksDone = snapshots.find(
                (s) => s.phase === "blocks" && s.artifacts.draftLesson !== undefined
            );
            expect(blocksDone).toBeDefined();
        });

        it("validation artifact is populated after validate phase", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            const snapshots: import("../contracts/compiler").CompilerRun[] = [];

            for await (const run of staged.compile("Rust Ownership")) {
                snapshots.push(run);
            }

            const validateDone = snapshots.find(
                (s) => s.phase === "validate" && s.artifacts.validation !== undefined
            );
            expect(validateDone).toBeDefined();
            expect(validateDone?.artifacts.validation?.isValid).toBe(true);
        });

        it("artifacts accumulate — final snapshot has all four artifacts", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            let last: import("../contracts/compiler").CompilerRun | undefined;

            for await (const run of staged.compile("Rust Ownership")) {
                last = run;
            }

            expect(last?.artifacts.brief).toBeDefined();
            expect(last?.artifacts.skeleton).toBeDefined();
            expect(last?.artifacts.draftLesson).toBeDefined();
            expect(last?.artifacts.validation).toBeDefined();
        });

        it("all compiler methods are called exactly once", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });

            // Drain the generator
            for await (const _ of staged.compile("Rust Ownership")) {
                // no-op
            }

            expect(compiler.generateResearchBrief).toHaveBeenCalledTimes(1);
            expect(compiler.generateSkeleton).toHaveBeenCalledTimes(1);
            expect(compiler.authorBlocks).toHaveBeenCalledTimes(1);
            expect(compiler.validateLesson).toHaveBeenCalledTimes(1);
            expect(compiler.packageLessonVersion).toHaveBeenCalledTimes(1);
        });
    });

    // -------------------------------------------------------------------------
    // Failure handling
    // -------------------------------------------------------------------------

    describe("compile() — failure handling", () => {
        it("yields a 'failed' snapshot and stops if brief step throws", async () => {
            const compiler = makeMockCompiler({
                generateResearchBrief: vi.fn().mockRejectedValue(new Error("LLM timeout")),
            });
            const staged = new StagedContentCompiler({ compiler });
            const snapshots: import("../contracts/compiler").CompilerRun[] = [];

            for await (const run of staged.compile("Rust Ownership")) {
                snapshots.push(run);
            }

            const failedSnap = snapshots[snapshots.length - 1];
            expect(failedSnap.status).toBe("failed");

            // Should not have called downstream phases
            expect(compiler.generateSkeleton).not.toHaveBeenCalled();
            expect(compiler.authorBlocks).not.toHaveBeenCalled();
        });

        it("yields a 'failed' snapshot and stops if skeleton step throws", async () => {
            const compiler = makeMockCompiler({
                generateSkeleton: vi.fn().mockRejectedValue(new Error("LLM error")),
            });
            const staged = new StagedContentCompiler({ compiler });
            const snapshots: import("../contracts/compiler").CompilerRun[] = [];

            for await (const run of staged.compile("Rust Ownership")) {
                snapshots.push(run);
            }

            const failedSnap = snapshots[snapshots.length - 1];
            expect(failedSnap.status).toBe("failed");
            expect(compiler.authorBlocks).not.toHaveBeenCalled();
        });

        it("yields a 'failed' snapshot and stops if validate step throws", async () => {
            const compiler = makeMockCompiler({
                validateLesson: vi.fn().mockRejectedValue(new Error("Validation error")),
            });
            const staged = new StagedContentCompiler({ compiler });
            const snapshots: import("../contracts/compiler").CompilerRun[] = [];

            for await (const run of staged.compile("Rust Ownership")) {
                snapshots.push(run);
            }

            const failedSnap = snapshots[snapshots.length - 1];
            expect(failedSnap.status).toBe("failed");
            expect(compiler.packageLessonVersion).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------------------
    // runFull() convenience method
    // -------------------------------------------------------------------------

    describe("runFull()", () => {
        it("collects all snapshots and returns a finalRun", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            const { snapshots, finalRun } = await staged.runFull("Rust Ownership");

            expect(snapshots.length).toBeGreaterThan(0);
            expect(finalRun.status).toBe("completed");
        });

        it("finalRun id matches snapshot ids", async () => {
            const compiler = makeMockCompiler();
            const staged = new StagedContentCompiler({ compiler });
            const { snapshots, finalRun } = await staged.runFull("Rust Ownership");

            const ids = new Set(snapshots.map((s) => s.id));
            expect(ids.size).toBe(1); // All snapshots belong to the same run
            expect(ids.has(finalRun.id)).toBe(true);
        });

        it("is deterministic — same topic input yields same phase sequence", async () => {
            const compiler = makeMockCompiler();
            const staged1 = new StagedContentCompiler({ compiler });
            const staged2 = new StagedContentCompiler({ compiler });

            const { snapshots: s1 } = await staged1.runFull("Rust Ownership");
            const { snapshots: s2 } = await staged2.runFull("Rust Ownership");

            const phases1 = s1.map((s) => s.phase);
            const phases2 = s2.map((s) => s.phase);

            expect(phases1).toEqual(phases2);
        });
    });
});
