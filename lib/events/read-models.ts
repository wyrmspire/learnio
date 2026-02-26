import { DomainEvent } from "./types";

// --- Read Model Types ---

export interface CourseProgress {
  courseId: string;
  percentComplete: number;
  currentLessonId: string | null;
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

// --- Projectors ---

/**
 * Projects a stream of events into a CourseProgress read model.
 * Pure function: Events[] -> CourseProgress
 */
export function projectCourseProgress(
  events: DomainEvent[], 
  courseId: string,
  totalLessonsInCourse: number
): CourseProgress {
  
  const courseEvents = events.filter(e => {
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

  const completedCount = completedLessons.size;
  const percent = totalLessonsInCourse > 0 
    ? Math.round((completedCount / totalLessonsInCourse) * 100) 
    : 0;

  return {
    courseId,
    percentComplete: percent,
    currentLessonId: null, // Logic to determine "next" would go here based on order
    completedLessonIds: Array.from(completedLessons),
    startedAt,
    lastActivityAt
  };
}
