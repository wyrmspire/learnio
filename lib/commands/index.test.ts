import { describe, it, expect } from "vitest";
import { submitAttemptCommand } from "./index";

const baseAttempt = {
    id: "att-1",
    userId: "user-1",
    skillId: "skill-ai-eng",
    courseId: "course-rust-101",
    lessonId: "lesson-ownership",
    cuId: "cu-lifetimes",
    blockId: "block-exercise-1",
    inputs: { answer: "42" },
    hintsUsed: 0,
    misconceptionTags: [] as string[],
    timestamp: "2026-01-01T00:00:00.000Z",
};

describe("submitAttemptCommand", () => {
    it("emits exactly one AttemptSubmitted event on stage=plan", () => {
        const events = submitAttemptCommand({ ...baseAttempt, stage: "plan" });
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe("AttemptSubmitted");
    });

    it("emits three events on stage=act (AttemptSubmitted, ConfidenceUpdated, CULoopClosed)", () => {
        const events = submitAttemptCommand({ ...baseAttempt, stage: "act" });
        expect(events).toHaveLength(3);
        const types = events.map((e) => e.type);
        expect(types).toContain("AttemptSubmitted");
        expect(types).toContain("ConfidenceUpdated");
        expect(types).toContain("CULoopClosed");
    });

    it("AttemptSubmitted event carries full identity: skillId, courseId, lessonId, blockId", () => {
        const events = submitAttemptCommand({ ...baseAttempt, stage: "plan" });
        const submitted = events.find((e) => e.type === "AttemptSubmitted") as any;
        expect(submitted).toBeDefined();
        expect(submitted.payload.skillId).toBe("skill-ai-eng");
        expect(submitted.payload.courseId).toBe("course-rust-101");
        expect(submitted.payload.lessonId).toBe("lesson-ownership");
        expect(submitted.payload.blockId).toBe("block-exercise-1");
        expect(submitted.payload.cuId).toBe("cu-lifetimes");
        expect(submitted.userId).toBe("user-1");
    });

    it("hint penalty reduces confidence delta proportionally", () => {
        const eventsNoHints = submitAttemptCommand({ ...baseAttempt, stage: "act", hintsUsed: 0 });
        const eventsWithHints = submitAttemptCommand({ ...baseAttempt, stage: "act", hintsUsed: 3 });

        const confNoHints = eventsNoHints.find((e) => e.type === "ConfidenceUpdated") as any;
        const confWithHints = eventsWithHints.find((e) => e.type === "ConfidenceUpdated") as any;

        // Delta with hints should be lower (or at minimum floor 0.01)
        expect(confWithHints.payload.delta).toBeLessThan(confNoHints.payload.delta);
        expect(confWithHints.payload.reason).toBe("hint_penalty");
        expect(confNoHints.payload.reason).toBe("loop_closed");
    });

    it("confidence delta never goes below 0.01 regardless of hint count", () => {
        const events = submitAttemptCommand({ ...baseAttempt, stage: "act", hintsUsed: 100 });
        const conf = events.find((e) => e.type === "ConfidenceUpdated") as any;
        expect(conf.payload.delta).toBeGreaterThanOrEqual(0.01);
    });

    it("all events carry userId", () => {
        const events = submitAttemptCommand({ ...baseAttempt, stage: "act" });
        for (const event of events) {
            expect(event.userId).toBe("user-1");
        }
    });

    it("plan and do and check stages each emit exactly one event", () => {
        for (const stage of ["plan", "do", "check"] as const) {
            const events = submitAttemptCommand({ ...baseAttempt, stage });
            expect(events).toHaveLength(1);
            expect(events[0].type).toBe("AttemptSubmitted");
        }
    });
});
