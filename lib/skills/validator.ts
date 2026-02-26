import {
    SkillManifestSchema,
    CourseManifestSchema,
    SkillManifest,
    CourseManifest,
} from "../contracts/skills";
import { LessonSpecSchema, LessonSpec } from "../contracts/lesson";

export interface ValidationReport {
    errors: string[];
    warnings: string[];
}

/**
 * Validates a collection of skills, courses, and lessons.
 * Checks schemas, uniqueness constraints, and dangling references.
 * Pure function - does not exit the process or mutate state.
 */
export function validateBundle(
    skills: unknown[],
    courses: unknown[],
    lessons: unknown[]
): ValidationReport {
    const report: ValidationReport = { errors: [], warnings: [] };

    const validSkills: SkillManifest[] = [];
    const validCourses: CourseManifest[] = [];
    const validLessons: LessonSpec[] = [];

    // ---- 1. VALIDATE SCHEMAS ----

    for (const raw of skills) {
        const result = SkillManifestSchema.safeParse(raw);
        if (!result.success) {
            const id = (raw as any)?.id ?? "<unknown>";
            for (const issue of result.error.issues) {
                report.errors.push(`[SCHEMA] Skill '${id}': ${issue.path.join(".")} — ${issue.message}`);
            }
        } else {
            validSkills.push(result.data);
        }
    }

    for (const raw of courses) {
        const result = CourseManifestSchema.safeParse(raw);
        if (!result.success) {
            const id = (raw as any)?.id ?? "<unknown>";
            for (const issue of result.error.issues) {
                report.errors.push(`[SCHEMA] Course '${id}': ${issue.path.join(".")} — ${issue.message}`);
            }
        } else {
            validCourses.push(result.data);
        }
    }

    for (const raw of lessons) {
        const result = LessonSpecSchema.safeParse(raw);
        if (!result.success) {
            const id = (raw as any)?.id ?? "<unknown>";
            for (const issue of result.error.issues) {
                report.errors.push(`[SCHEMA] Lesson '${id}': ${issue.path.join(".")} — ${issue.message}`);
            }
        } else {
            validLessons.push(result.data);
        }
    }

    // ---- 2. VALIDATE UNIQUENESS ----
    // skillId, courseId, lessonId globally unique. blockId unique within lesson.

    const skillIds = new Set<string>();
    for (const skill of validSkills) {
        if (skillIds.has(skill.id)) {
            report.errors.push(`[UNIQUENESS] Duplicate skillId: '${skill.id}'`);
        }
        skillIds.add(skill.id);
    }

    const courseIds = new Set<string>();
    for (const course of validCourses) {
        if (courseIds.has(course.id)) {
            report.errors.push(`[UNIQUENESS] Duplicate courseId: '${course.id}'`);
        }
        courseIds.add(course.id);
    }

    const lessonIds = new Set<string>();
    for (const lesson of validLessons) {
        if (lessonIds.has(lesson.id)) {
            report.errors.push(`[UNIQUENESS] Duplicate lessonId: '${lesson.id}'`);
        }
        lessonIds.add(lesson.id);

        const blockIds = new Set<string>();
        const allBlocks = [
            ...(lesson.stages.plan.blocks ?? []),
            ...(lesson.stages.do.blocks ?? []),
            ...(lesson.stages.check.blocks ?? []),
            ...(lesson.stages.act.blocks ?? []),
        ];

        for (const block of allBlocks) {
            if (blockIds.has(block.id)) {
                report.errors.push(`[UNIQUENESS] Duplicate blockId '${block.id}' within lesson '${lesson.id}'`);
            }
            blockIds.add(block.id);
        }
    }

    // ---- 3. VALIDATE DANGLING REFS ----

    // Check course -> skill refs
    for (const course of validCourses) {
        if (!skillIds.has(course.skillId)) {
            report.errors.push(`[DANGLING] Course '${course.id}' references unknown skillId '${course.skillId}'`);
        }
        // Check course -> lesson refs
        for (const lessonId of course.lessonOrder) {
            if (!lessonIds.has(lessonId)) {
                report.errors.push(`[DANGLING] Course '${course.id}' references unknown lessonId '${lessonId}'`);
            }
        }
    }

    // Check skill -> branch refs
    for (const skill of validSkills) {
        for (const branch of skill.branches ?? []) {
            if (!courseIds.has(branch.targetCourseId)) {
                report.warnings.push(`[DANGLING] Skill '${skill.id}' branch references unknown courseId '${branch.targetCourseId}'`);
            }
        }
        // Check prerequisite skill refs
        for (const prereq of skill.prerequisites ?? []) {
            if (!skillIds.has(prereq)) {
                report.warnings.push(`[DANGLING] Skill '${skill.id}' prerequisite references unknown skillId '${prereq}'`);
            }
        }
    }

    return report;
}
