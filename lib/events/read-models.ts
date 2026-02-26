import { DomainEvent } from "./types";
import { LessonVersion } from "../contracts/compiler";

// --- Read Model Types ---

export interface CourseProgress {
  courseId: string;
  percentComplete: number;
  currentLessonId: string | null;
  nextLessonId: string | null;
  completedLessonIds: string[];
  startedAt: string;
  lastActivityAt: string;
}

export interface SkillMastery {
  skillId: string;
  masteryLevel: "novice" | "competent" | "expert";
  coursesCompleted: number;
  totalCourses: number;
}

export interface StalenessReport {
  lessonId: string;
  versionId: string;
  staleAfter: string;
  isStale: boolean;
  daysSinceStale: number; // negative if not yet stale
  recommendation: "refresh-recommended" | "ok" | "do-not-auto-publish";
}

export interface PracticeQueueItem {
  lessonId: string;
  blockId?: string;
  reason:
    | "misconception"
    | "stale-risk"
    | "hint-dependent"
    | "regression"
    | "transfer-not-proven"; // FUTURE: transfer-not-proven not yet emitted
  priority: number; // higher = more urgent
  dueAt?: string; // ISO date, for spaced repetition
}

// --- Projectors ---

/**
 * Projects a stream of events into a CourseProgress read model.
 * Pure function: Events[] -> CourseProgress
 *
 * @param events      - Full event log (unfiltered; this function filters internally)
 * @param courseId    - The course to project progress for
 * @param lessonOrder - Ordered array of lessonIds belonging to this course
 */
export function projectCourseProgress(
  events: DomainEvent[],
  courseId: string,
  lessonOrder: string[]
): CourseProgress {
  // Guard: no lessons in course = 0% with no current lesson
  if (lessonOrder.length === 0) {
    return {
      courseId,
      percentComplete: 0,
      currentLessonId: null,
      nextLessonId: null,
      completedLessonIds: [],
      startedAt: "",
      lastActivityAt: "",
    };
  }

  const courseEvents = events.filter((e) => {
    if (e.type === "LessonCompleted") return e.payload.courseId === courseId;
    if (e.type === "AttemptSubmitted") return e.payload.courseId === courseId;
    return false;
  });

  const completedLessons = new Set<string>();
  let startedAt = "";
  let lastActivityAt = "";

  for (const event of courseEvents) {
    if (!startedAt) startedAt = event.timestamp;
    lastActivityAt = event.timestamp;

    if (event.type === "LessonCompleted") {
      completedLessons.add(event.payload.lessonId);
    }
  }

  // Determine current and next lesson from the ordered list
  // currentLessonId: first lessonId in order that is NOT completed
  // If all completed, currentLessonId = null
  let currentLessonId: string | null = null;
  let nextLessonId: string | null = null;

  for (let i = 0; i < lessonOrder.length; i++) {
    const lessonId = lessonOrder[i];
    if (!completedLessons.has(lessonId)) {
      currentLessonId = lessonId;
      nextLessonId = lessonOrder[i + 1] ?? null;
      break;
    }
  }

  const completedCount = completedLessons.size;
  // Use lessonOrder.length as the authoritative total (not totalLessonsInCourse)
  const percent =
    lessonOrder.length > 0
      ? Math.round((completedCount / lessonOrder.length) * 100)
      : 0;

  return {
    courseId,
    percentComplete: currentLessonId === null ? 100 : percent,
    currentLessonId,
    nextLessonId,
    completedLessonIds: Array.from(completedLessons),
    startedAt,
    lastActivityAt,
  };
}

/**
 * Projects skill mastery from a map of computed course progress objects.
 * Pure function: (skillId, courseIds, courseProgressMap) -> SkillMastery
 *
 * @param skillId          - The skill to compute mastery for
 * @param courseIds        - All course IDs belonging to this skill
 * @param courseProgressMap - A pre-computed map of courseId -> CourseProgress
 */
export function projectSkillMastery(
  skillId: string,
  courseIds: string[],
  courseProgressMap: Map<string, CourseProgress>
): SkillMastery {
  const totalCourses = courseIds.length;
  let coursesCompleted = 0;

  for (const courseId of courseIds) {
    const progress = courseProgressMap.get(courseId);
    if (progress && progress.percentComplete === 100) {
      coursesCompleted++;
    }
  }

  const completionRatio = totalCourses > 0 ? coursesCompleted / totalCourses : 0;

  let masteryLevel: "novice" | "competent" | "expert";
  if (completionRatio >= 1) {
    masteryLevel = "expert";
  } else if (completionRatio >= 0.33) {
    masteryLevel = "competent";
  } else {
    masteryLevel = "novice";
  }

  return {
    skillId,
    masteryLevel,
    coursesCompleted,
    totalCourses,
  };
}

/**
 * Projects a staleness report for all published lessons.
 * Pure function: (publishedLessons, now) -> StalenessReport[]
 *
 * @param publishedLessons - Array of published LessonVersion objects
 * @param now              - ISO date string representing the current time (inject; no Date.now())
 */
export function projectStalenessReport(
  publishedLessons: LessonVersion[],
  now: string
): StalenessReport[] {
  const nowMs = new Date(now).getTime();

  return publishedLessons.map((lesson) => {
    if (!lesson.staleAfter) {
      return {
        lessonId: lesson.lessonId,
        versionId: lesson.id,
        staleAfter: "",
        isStale: false,
        daysSinceStale: 0,
        recommendation: "ok" as const,
      };
    }

    const staleAfterMs = new Date(lesson.staleAfter).getTime();
    const diffMs = nowMs - staleAfterMs;
    const daysSinceStale = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isStale = diffMs > 0;

    return {
      lessonId: lesson.lessonId,
      versionId: lesson.id,
      staleAfter: lesson.staleAfter,
      isStale,
      daysSinceStale,
      recommendation: isStale ? ("refresh-recommended" as const) : ("ok" as const),
    };
  });
}

/**
 * Projects a ranked practice queue from event history and published lessons.
 * Pure function: (events, publishedLessons, now) -> PracticeQueueItem[]
 *
 * Signals:
 *   hint-dependent: HintRevealed count >= 2 for a lesson/block
 *   stale-risk: now > lesson.staleAfter
 *   regression: ConfidenceUpdated with reason "regression"
 *
 * Note: "transfer-not-proven" is reserved for when a TransferTestFailed event
 * type is introduced. It is in the enum but not yet emitted.
 *
 * @param events           - Full event log
 * @param publishedLessons - Published lesson versions (for staleness check)
 * @param now              - ISO date string for current time (inject; no Date.now())
 */
export function projectPracticeQueue(
  events: DomainEvent[],
  publishedLessons: LessonVersion[],
  now: string
): PracticeQueueItem[] {
  const nowMs = new Date(now).getTime();
  const itemMap = new Map<string, PracticeQueueItem>();

  // --- Signal: hint-dependent ---
  // Count HintRevealed per lessonId+blockId
  const hintCounts = new Map<string, { lessonId: string; blockId: string; count: number }>();
  for (const event of events) {
    if (event.type === "HintRevealed") {
      const { lessonId, blockId } = event.payload;
      const key = `${lessonId}::${blockId}`;
      const existing = hintCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        hintCounts.set(key, { lessonId, blockId, count: 1 });
      }
    }
  }
  for (const [key, { lessonId, blockId, count }] of hintCounts) {
    if (count >= 2) {
      itemMap.set(key, {
        lessonId,
        blockId,
        reason: "hint-dependent",
        priority: count,
      });
    }
  }

  // --- Signal: stale-risk ---
  for (const lesson of publishedLessons) {
    if (lesson.staleAfter) {
      const staleAfterMs = new Date(lesson.staleAfter).getTime();
      if (nowMs > staleAfterMs) {
        const key = `stale::${lesson.lessonId}`;
        // Don't override a higher-priority hint-dependent entry for same lesson
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            lessonId: lesson.lessonId,
            reason: "stale-risk",
            priority: 5,
          });
        }
      }
    }
  }

  // --- Signal: regression ---
  const regressionLessons = new Set<string>();
  for (const event of events) {
    if (
      event.type === "ConfidenceUpdated" &&
      event.payload.reason === "regression"
    ) {
      // ConfidenceUpdated ties to cuId, not lessonId — best effort: flag by cuId
      const regressionKey = `regression::${event.payload.cuId}`;
      if (!regressionLessons.has(regressionKey)) {
        regressionLessons.add(regressionKey);
        itemMap.set(regressionKey, {
          lessonId: event.payload.cuId, // cuId stands in until lessonId is in this event
          reason: "regression",
          priority: 10,
        });
      }
    }
  }

  // Sort by priority descending
  return Array.from(itemMap.values()).sort((a, b) => b.priority - a.priority);
}
