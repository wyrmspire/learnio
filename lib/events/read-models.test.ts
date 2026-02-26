import { describe, it, expect } from "vitest";
import {
    projectCourseProgress,
    projectSkillMastery,
    projectStalenessReport,
    projectPracticeQueue,
    CourseProgress,
} from "./read-models";
import { DomainEvent, LessonCompletedEvent } from "./types";
import { LessonVersion } from "../contracts/compiler";

// --- Fixtures ---

const NOW = "2026-01-01T00:00:00.000Z";
const PAST = "2025-01-01T00:00:00.000Z"; // stale
const FUTURE = "2027-01-01T00:00:00.000Z"; // not yet stale

function makeLessonCompleted(
    lessonId: string,
    courseId: string,
    timestamp = NOW
): LessonCompletedEvent {
    return {
        id: `evt-${lessonId}`,
        type: "LessonCompleted",
        userId: "user-1",
        timestamp,
        payload: { lessonId, courseId },
    };
}

function makeAttemptSubmitted(courseId: string, timestamp = NOW): DomainEvent {
    return {
        id: `evt-attempt-${courseId}-${timestamp}`,
        type: "AttemptSubmitted",
        userId: "user-1",
        timestamp,
        payload: { cuId: "cu-1", courseId, stage: "plan", inputs: {} },
    };
}

function makeHintRevealed(
    lessonId: string,
    blockId: string,
    hintIndex: number,
    timestamp = NOW
): DomainEvent {
    return {
        id: `hint-${lessonId}-${blockId}-${hintIndex}`,
        type: "HintRevealed",
        userId: "user-1",
        timestamp,
        payload: { lessonId, blockId, hintIndex },
    };
}

function makeLessonVersion(
    lessonId: string,
    versionId: string,
    staleAfter?: string
): LessonVersion {
    return {
        id: versionId,
        lessonId,
        spec: {} as any,
        compilerRunId: "run-1",
        createdAt: NOW,
        publishedAt: NOW,
        sourceProvider: "manual_seed",
        refreshPolicyDays: 90,
        staleAfter,
    };
}

// ============================================================
// C1: projectCourseProgress
// ============================================================

describe("projectCourseProgress", () => {
    const courseId = "course-rust";
    const lessonOrder = ["lesson-1", "lesson-2", "lesson-3"];

    it("returns 0% with currentLessonId as first lesson when no events", () => {
        const result = projectCourseProgress([], courseId, lessonOrder);

        expect(result.percentComplete).toBe(0);
        expect(result.currentLessonId).toBe("lesson-1");
        expect(result.nextLessonId).toBe("lesson-2");
        expect(result.completedLessonIds).toEqual([]);
        expect(result.startedAt).toBe("");
        expect(result.lastActivityAt).toBe("");
    });

    it("advances currentLessonId after first lesson is completed", () => {
        const events: DomainEvent[] = [
            makeLessonCompleted("lesson-1", courseId, "2026-01-01T01:00:00.000Z"),
        ];
        const result = projectCourseProgress(events, courseId, lessonOrder);

        expect(result.currentLessonId).toBe("lesson-2");
        expect(result.nextLessonId).toBe("lesson-3");
        expect(result.completedLessonIds).toContain("lesson-1");
        expect(result.percentComplete).toBe(33);
    });

    it("returns 100% with null currentLessonId when all lessons completed", () => {
        const events: DomainEvent[] = [
            makeLessonCompleted("lesson-1", courseId, "2026-01-01T01:00:00.000Z"),
            makeLessonCompleted("lesson-2", courseId, "2026-01-01T02:00:00.000Z"),
            makeLessonCompleted("lesson-3", courseId, "2026-01-01T03:00:00.000Z"),
        ];
        const result = projectCourseProgress(events, courseId, lessonOrder);

        expect(result.percentComplete).toBe(100);
        expect(result.currentLessonId).toBeNull();
        expect(result.nextLessonId).toBeNull();
        expect(result.completedLessonIds).toHaveLength(3);
    });

    // Edge case: empty lessonOrder
    it("returns 0% with null currentLessonId when lessonOrder is empty", () => {
        const result = projectCourseProgress([], courseId, []);

        expect(result.percentComplete).toBe(0);
        expect(result.currentLessonId).toBeNull();
        expect(result.nextLessonId).toBeNull();
        expect(result.completedLessonIds).toEqual([]);
    });

    // Edge case: unknown lessonId in order (completed a lesson not in the order)
    it("behaves deterministically when lessonOrder contains a lessonId that was never completed", () => {
        // "lesson-unknown" is in the order but has no completion event
        const partialOrder = ["lesson-known", "lesson-unknown"];
        const events: DomainEvent[] = [
            makeLessonCompleted("lesson-known", courseId),
        ];
        const result = projectCourseProgress(events, courseId, partialOrder);

        // currentLessonId should be the next unfinished: lesson-unknown
        expect(result.currentLessonId).toBe("lesson-unknown");
        expect(result.nextLessonId).toBeNull();
        expect(result.percentComplete).toBe(50);
    });

    it("only tracks events for the specified courseId", () => {
        const events: DomainEvent[] = [
            makeLessonCompleted("lesson-1", "other-course"),
        ];
        const result = projectCourseProgress(events, courseId, lessonOrder);
        expect(result.completedLessonIds).toHaveLength(0);
        expect(result.currentLessonId).toBe("lesson-1");
    });

    it("tracks startedAt and lastActivityAt from earliest/latest events", () => {
        const events: DomainEvent[] = [
            makeAttemptSubmitted(courseId, "2026-01-01T08:00:00.000Z"),
            makeLessonCompleted("lesson-1", courseId, "2026-01-01T09:00:00.000Z"),
        ];
        const result = projectCourseProgress(events, courseId, lessonOrder);
        expect(result.startedAt).toBe("2026-01-01T08:00:00.000Z");
        expect(result.lastActivityAt).toBe("2026-01-01T09:00:00.000Z");
    });
});

// ============================================================
// C2: projectSkillMastery
// ============================================================

describe("projectSkillMastery", () => {
    it("returns novice when no courses completed", () => {
        const map = new Map([
            [
                "course-a",
                {
                    courseId: "course-a",
                    percentComplete: 0,
                    currentLessonId: "l1",
                    nextLessonId: null,
                    completedLessonIds: [],
                    startedAt: "",
                    lastActivityAt: "",
                },
            ],
        ]);
        const result = projectSkillMastery("skill-ai", ["course-a"], map);
        expect(result.masteryLevel).toBe("novice");
        expect(result.coursesCompleted).toBe(0);
        expect(result.totalCourses).toBe(1);
    });

    it("returns competent when >=33% but <100% of courses are done", () => {
        const map = new Map<string, CourseProgress>([
            [
                "course-a",
                {
                    courseId: "course-a",
                    percentComplete: 100,
                    currentLessonId: null,
                    nextLessonId: null,
                    completedLessonIds: [],
                    startedAt: "",
                    lastActivityAt: "",
                },
            ],
            [
                "course-b",
                {
                    courseId: "course-b",
                    percentComplete: 50,
                    currentLessonId: "l1",
                    nextLessonId: null,
                    completedLessonIds: [],
                    startedAt: "",
                    lastActivityAt: "",
                },
            ],
            [
                "course-c",
                {
                    courseId: "course-c",
                    percentComplete: 0,
                    currentLessonId: "l1",
                    nextLessonId: null,
                    completedLessonIds: [],
                    startedAt: "",
                    lastActivityAt: "",
                },
            ],
        ]);
        // 1/3 = 33% -> competent
        const result = projectSkillMastery(
            "skill-ai",
            ["course-a", "course-b", "course-c"],
            map
        );
        expect(result.masteryLevel).toBe("competent");
        expect(result.coursesCompleted).toBe(1);
    });

    it("returns expert when all courses are completed", () => {
        const map = new Map<string, CourseProgress>([
            [
                "course-a",
                {
                    courseId: "course-a",
                    percentComplete: 100,
                    currentLessonId: null,
                    nextLessonId: null,
                    completedLessonIds: [],
                    startedAt: "",
                    lastActivityAt: "",
                },
            ],
            [
                "course-b",
                {
                    courseId: "course-b",
                    percentComplete: 100,
                    currentLessonId: null,
                    nextLessonId: null,
                    completedLessonIds: [],
                    startedAt: "",
                    lastActivityAt: "",
                },
            ],
        ]);
        const result = projectSkillMastery("skill-ai", ["course-a", "course-b"], map);
        expect(result.masteryLevel).toBe("expert");
        expect(result.coursesCompleted).toBe(2);
        expect(result.totalCourses).toBe(2);
    });

    it("handles empty courseIds gracefully", () => {
        const result = projectSkillMastery("skill-ai", [], new Map());
        expect(result.masteryLevel).toBe("novice");
        expect(result.coursesCompleted).toBe(0);
        expect(result.totalCourses).toBe(0);
    });
});

// ============================================================
// C4: projectStalenessReport
// ============================================================

describe("projectStalenessReport", () => {
    it("marks a lesson as stale when now is past staleAfter", () => {
        const lessons = [makeLessonVersion("lesson-1", "v1", PAST)];
        const [report] = projectStalenessReport(lessons, NOW);

        expect(report.isStale).toBe(true);
        expect(report.daysSinceStale).toBeGreaterThan(0);
        expect(report.recommendation).toBe("refresh-recommended");
    });

    it("marks a lesson as ok when staleAfter is in the future", () => {
        const lessons = [makeLessonVersion("lesson-2", "v2", FUTURE)];
        const [report] = projectStalenessReport(lessons, NOW);

        expect(report.isStale).toBe(false);
        expect(report.daysSinceStale).toBeLessThan(0);
        expect(report.recommendation).toBe("ok");
    });

    it("returns ok for lessons with no staleAfter set", () => {
        const lessons = [makeLessonVersion("lesson-3", "v3", undefined)];
        const [report] = projectStalenessReport(lessons, NOW);

        expect(report.isStale).toBe(false);
        expect(report.recommendation).toBe("ok");
    });

    it("handles an empty lessons array", () => {
        const result = projectStalenessReport([], NOW);
        expect(result).toHaveLength(0);
    });

    it("correctly populates lessonId and versionId", () => {
        const lessons = [makeLessonVersion("lesson-abc", "version-xyz", PAST)];
        const [report] = projectStalenessReport(lessons, NOW);
        expect(report.lessonId).toBe("lesson-abc");
        expect(report.versionId).toBe("version-xyz");
    });
});

// ============================================================
// C3: projectPracticeQueue (bonus — ties it all together)
// ============================================================

describe("projectPracticeQueue", () => {
    it("queues hint-dependent lessons when hint count >= 2", () => {
        const events: DomainEvent[] = [
            makeHintRevealed("lesson-1", "block-1", 0),
            makeHintRevealed("lesson-1", "block-1", 1),
        ];
        const result = projectPracticeQueue(events, [], NOW);
        expect(result.some((i) => i.reason === "hint-dependent")).toBe(true);
        const item = result.find((i) => i.lessonId === "lesson-1");
        expect(item?.blockId).toBe("block-1");
    });

    it("does NOT queue hint-dependent lessons with < 2 hints", () => {
        const events: DomainEvent[] = [makeHintRevealed("lesson-2", "block-1", 0)];
        const result = projectPracticeQueue(events, [], NOW);
        expect(result.some((i) => i.lessonId === "lesson-2")).toBe(false);
    });

    it("queues stale-risk lessons", () => {
        const lessons = [makeLessonVersion("lesson-stale", "v-stale", PAST)];
        const result = projectPracticeQueue([], lessons, NOW);
        expect(result.some((i) => i.reason === "stale-risk")).toBe(true);
    });

    it("does not queue non-stale lessons for stale-risk", () => {
        const lessons = [makeLessonVersion("lesson-fresh", "v-fresh", FUTURE)];
        const result = projectPracticeQueue([], lessons, NOW);
        expect(result.some((i) => i.reason === "stale-risk")).toBe(false);
    });

    it("sorts by priority descending", () => {
        const events: DomainEvent[] = [
            makeHintRevealed("l1", "b1", 0),
            makeHintRevealed("l1", "b1", 1),
            makeHintRevealed("l1", "b1", 2), // priority = 3
        ];
        const lessons = [makeLessonVersion("l2", "v2", PAST)]; // priority = 5
        const result = projectPracticeQueue(events, lessons, NOW);
        expect(result[0].priority).toBeGreaterThanOrEqual(result[1]?.priority ?? 0);
    });

    it("is pure — identical inputs return equal outputs", () => {
        const events: DomainEvent[] = [
            makeHintRevealed("lesson-1", "block-1", 0),
            makeHintRevealed("lesson-1", "block-1", 1),
        ];
        const r1 = projectPracticeQueue(events, [], NOW);
        const r2 = projectPracticeQueue(events, [], NOW);
        expect(r1).toEqual(r2);
    });
});
