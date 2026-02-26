import { describe, it, expect } from "vitest";
import { projectCourseProgress, projectStalenessReport } from "../events/read-models";
import { pdcaReducer, initialPDCAState } from "../pdca/reducer";
import type { DomainEvent } from "../events/types";
import type { PDCAAction } from "../pdca/types";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// D4: Determinism Audit Suite
//
// Rule: pure functions must be fully deterministic — same inputs,
//       always same outputs, no hidden internal state or randomness.
//
// Date.now() policy:
//   ALLOWED: Inside lib/commands/* (event ID generation)
//   ALLOWED: lib/data/mock-compiler.ts, lib/data/lesson-store.ts(seed),
//             lib/skills/loader.ts (staleAfter calculation)
//   DISALLOWED: Read model projectors and validators
// ============================================================

const NOW = "2026-01-01T00:00:00.000Z";
const PAST_STALE = "2025-06-01T00:00:00.000Z";

// --- Fixture: fixed event log ---
function makeFixedEvents(): DomainEvent[] {
    return [
        {
            id: "e1",
            type: "LessonCompleted",
            userId: "user-1",
            timestamp: "2025-12-01T00:00:00.000Z",
            payload: { lessonId: "l1", courseId: "c1" },
        },
        {
            id: "e2",
            type: "AttemptSubmitted",
            userId: "user-1",
            timestamp: "2025-12-02T00:00:00.000Z",
            payload: { cuId: "cu-1", courseId: "c1", stage: "plan", inputs: {} },
        },
    ];
}

// --- Fixture: fixed PDCA action sequence ---
function makePDCAActions(): PDCAAction[] {
    return [
        { type: "COMMIT_PREDICTION" },
        { type: "SUBMIT_DIAGNOSIS", payload: "My answer" },
        { type: "COMPLETE_CHECK" },
    ];
}

// ============================================================
// 1. Read model replayability
// ============================================================

describe("Determinism: projectCourseProgress", () => {
    it("produces identical output on multiple calls with same input", () => {
        const events = makeFixedEvents();
        const lessonOrder = ["l1", "l2", "l3"];

        const r1 = projectCourseProgress(events, "c1", lessonOrder);
        const r2 = projectCourseProgress(events, "c1", lessonOrder);
        const r3 = projectCourseProgress(events, "c1", lessonOrder);

        expect(r1).toEqual(r2);
        expect(r2).toEqual(r3);
    });

    it("is stable across 10 repeated calls", () => {
        const events = makeFixedEvents();
        const baseline = projectCourseProgress(events, "c1", ["l1", "l2"]);
        for (let i = 0; i < 10; i++) {
            expect(projectCourseProgress(events, "c1", ["l1", "l2"])).toEqual(baseline);
        }
    });
});

describe("Determinism: projectStalenessReport", () => {
    it("produces identical output on repeated calls with same input", () => {
        const lessons = [
            {
                id: "v1",
                lessonId: "l1",
                spec: {} as any,
                compilerRunId: "run-1",
                createdAt: NOW,
                publishedAt: NOW,
                sourceProvider: "manual_seed" as const,
                refreshPolicyDays: 90,
                staleAfter: PAST_STALE,
            },
        ];

        const r1 = projectStalenessReport(lessons, NOW);
        const r2 = projectStalenessReport(lessons, NOW);

        expect(r1).toEqual(r2);
    });
});

// ============================================================
// 2. PDCA reducer determinism
// ============================================================

describe("Determinism: pdcaReducer", () => {
    it("produces identical final state from same action sequence applied twice independently", () => {
        const actions = makePDCAActions();

        const state1 = actions.reduce(pdcaReducer, initialPDCAState);
        const state2 = actions.reduce(pdcaReducer, initialPDCAState);

        expect(state1).toEqual(state2);
    });

    it("is stable across 10 replays", () => {
        const actions = makePDCAActions();
        const baseline = actions.reduce(pdcaReducer, initialPDCAState);
        for (let i = 0; i < 10; i++) {
            expect(actions.reduce(pdcaReducer, initialPDCAState)).toEqual(baseline);
        }
    });
});

// ============================================================
// 3. Staleness report stress test (10 runs — same result every time)
// ============================================================

describe("Determinism: projectStalenessReport stress test", () => {
    it("returns the same result across 10 consecutive calls", () => {
        const lessons = [
            {
                id: "v1",
                lessonId: "l1",
                spec: {} as any,
                compilerRunId: "run-1",
                createdAt: NOW,
                publishedAt: NOW,
                sourceProvider: "manual_seed" as const,
                refreshPolicyDays: 90,
                staleAfter: PAST_STALE,
            },
        ];
        const baseline = projectStalenessReport(lessons, NOW);
        for (let i = 0; i < 10; i++) {
            expect(projectStalenessReport(lessons, NOW)).toEqual(baseline);
        }
    });
});

// ============================================================
// 4a. No Math.random() in /lib/ production files
// ============================================================

function getLibFiles(dir: string, exts = [".ts"]): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !fullPath.includes("node_modules")) {
            files.push(...getLibFiles(fullPath, exts));
        } else if (
            entry.isFile() &&
            exts.some((e) => entry.name.endsWith(e)) &&
            !entry.name.endsWith(".test.ts")
        ) {
            files.push(fullPath);
        }
    }
    return files;
}

// __dirname is lib/data/ — go up one to lib/
const LIB_DIR = path.resolve(__dirname, "..");

describe("Determinism: No Math.random() in /lib/ production code", () => {
    it("no production file in /lib uses Math.random()", () => {
        const files = getLibFiles(LIB_DIR);
        const violations: string[] = [];

        for (const file of files) {
            const lines = fs.readFileSync(file, "utf-8").split("\n");
            for (const line of lines) {
                const trimmed = line.trimStart();
                // Skip comment/doc lines (lines that start with * or //)
                if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
                if (trimmed.includes("Math.random()")) {
                    violations.push(path.relative(LIB_DIR, file));
                    break; // One violation per file is enough
                }
            }
        }

        expect(violations, `Files using Math.random(): ${violations.join(", ")}`).toHaveLength(0);
    });
});

// ============================================================
// 4b. Date.now() restricted to approved files only
// ============================================================

describe("Determinism: Date.now() allowed only in approved files", () => {
    // Approved: command handlers + compiler store helpers (Date.now for staleAfter/versionId)
    const ALLOWED_PATTERNS = [
        "commands",           // lib/commands/* — event ID generation
        "mock-compiler.ts",  // version ID generation
        "lesson-store.ts",   // seed() staleAfter
        "loader.ts",         // installSkill staleAfter
        "staged-compiler.ts", // compile() runId generation
        "mock.ts",            // session object factory (id generation)
    ];

    it("only approved files use Date.now() in executable code", () => {
        const files = getLibFiles(LIB_DIR);
        const violations: string[] = [];

        for (const file of files) {
            const normalized = file.replace(/\\/g, "/");
            const isAllowed = ALLOWED_PATTERNS.some((p) => normalized.includes(p));
            if (isAllowed) continue;

            const lines = fs.readFileSync(file, "utf-8").split("\n");
            for (const line of lines) {
                const trimmed = line.trimStart();
                // Skip comment/doc lines
                if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
                if (trimmed.includes("Date.now()")) {
                    violations.push(path.relative(LIB_DIR, file));
                    break;
                }
            }
        }

        expect(
            violations,
            `Files outside the allowed list using Date.now(): ${violations.join(", ")}`
        ).toHaveLength(0);
    });
});
