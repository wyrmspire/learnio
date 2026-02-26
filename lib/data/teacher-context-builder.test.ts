import { describe, it, expect } from "vitest";
import { buildTeacherContext } from "./teacher-context-builder";
import { mockRustLesson } from "./mock-lessons";
import { DomainEvent } from "../events/types";

const LESSON = mockRustLesson;
const LESSON_ID = LESSON.id; // "lesson-rust-ownership-101"

function makeHintRevealed(
    lessonId: string,
    blockId: string,
    hintIndex: number
): DomainEvent {
    return {
        id: `hint-${blockId}-${hintIndex}`,
        type: "HintRevealed",
        userId: "user-1",
        timestamp: "2026-01-01T00:00:00.000Z",
        payload: { lessonId, blockId, hintIndex },
    };
}

function makeAttemptSubmitted(
    lessonId: string,
    blockId: string,
    inputs: Record<string, any>
): DomainEvent {
    return {
        id: `att-${blockId}`,
        type: "AttemptSubmitted",
        userId: "user-1",
        timestamp: "2026-01-01T01:00:00.000Z",
        payload: { cuId: "cu-1", lessonId, blockId, stage: "do", inputs } as any,
    };
}

describe("buildTeacherContext", () => {
    it("finds the correct block from any PDCA stage", () => {
        const ctx = buildTeacherContext(LESSON, "block-do-2", []);
        expect(ctx.blockContent.id).toBe("block-do-2");
        expect(ctx.blockContent.type).toBe("exercise");
    });

    it("throws if blockId does not exist in the lesson", () => {
        expect(() => buildTeacherContext(LESSON, "block-nonexistent", [])).toThrow(
            'block "block-nonexistent" not found'
        );
    });

    it("counts hintsRevealed correctly — only for matching lessonId and blockId", () => {
        const events: DomainEvent[] = [
            makeHintRevealed(LESSON_ID, "block-do-2", 0),
            makeHintRevealed(LESSON_ID, "block-do-2", 1),
            makeHintRevealed("other-lesson", "block-do-2", 0), // different lesson — excluded
            makeHintRevealed(LESSON_ID, "block-plan-1", 0), // different block — excluded
        ];
        const ctx = buildTeacherContext(LESSON, "block-do-2", events);
        expect(ctx.hintsRevealed).toBe(2);
    });

    it("returns zero hintsRevealed when no matching events exist", () => {
        const ctx = buildTeacherContext(LESSON, "block-do-2", []);
        expect(ctx.hintsRevealed).toBe(0);
    });

    it("extracts hint ladder from exercise blocks", () => {
        const ctx = buildTeacherContext(LESSON, "block-do-2", []);
        expect(ctx.hintLadder.length).toBeGreaterThan(0);
        expect(ctx.hintLadder[0]).toContain("cloning");
    });

    it("returns empty hint ladder for non-exercise blocks", () => {
        const ctx = buildTeacherContext(LESSON, "block-plan-1", []);
        expect(ctx.hintLadder).toEqual([]);
    });

    it("returns the latest attempt inputs filtered by lessonId AND blockId", () => {
        const events: DomainEvent[] = [
            makeAttemptSubmitted(LESSON_ID, "block-do-2", { code: "attempt 1" }),
            makeAttemptSubmitted(LESSON_ID, "block-do-2", { code: "attempt 2" }), // newest
            makeAttemptSubmitted(LESSON_ID, "block-plan-1", { answer: "unrelated" }), // diff block
            makeAttemptSubmitted("other-lesson", "block-do-2", { code: "wrong lesson" }),
        ];
        const ctx = buildTeacherContext(LESSON, "block-do-2", events);
        expect(ctx.learnerAttempt).toEqual({ code: "attempt 2" });
    });

    it("returns null for learnerAttempt when no matching attempts exist", () => {
        const ctx = buildTeacherContext(LESSON, "block-do-2", []);
        expect(ctx.learnerAttempt).toBeNull();
    });

    it("includes all lesson citations in context", () => {
        const ctx = buildTeacherContext(LESSON, "block-do-2", []);
        expect(ctx.citations).toHaveLength(1);
        expect(ctx.citations[0].id).toBe("cit-1");
    });

    it("returns empty rubric for blocks without remediationTargets", () => {
        const ctx = buildTeacherContext(LESSON, "block-plan-1", []);
        expect(ctx.rubric).toEqual([]);
    });

    it("is pure — identical inputs produce identical outputs", () => {
        const events: DomainEvent[] = [makeHintRevealed(LESSON_ID, "block-do-2", 0)];
        const ctx1 = buildTeacherContext(LESSON, "block-do-2", events);
        const ctx2 = buildTeacherContext(LESSON, "block-do-2", events);
        expect(ctx1).toEqual(ctx2);
    });
});
