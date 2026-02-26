#!/usr/bin/env tsx
/**
 * validate-skills.ts
 *
 * A1 · validate:skills CLI Script
 *
 * Runs deterministic schema checks using Zod on all skill manifests,
 * course manifests, and lesson specs from the mock loader.
 *
 * Exit code 0: clean or warnings only
 * Exit code 1: any ERRORS
 *
 * Run: npx tsx scripts/validate-skills.ts
 */

import {
    SkillManifestSchema,
    CourseManifestSchema,
    SkillManifest,
    CourseManifest,
} from "../lib/contracts/skills";
import { LessonSpecSchema, LessonSpec } from "../lib/contracts/lesson";
import { LessonVersionSchema } from "../lib/contracts/compiler";

// ---- DATA TO VALIDATE ----------------------------------------------------
// In a real system this would be read from files on disk.
// For now we import from the loader's in-memory data (same source of truth).

const MOCK_SKILLS: Record<string, unknown> = {
    "skill-ai-eng": {
        id: "skill-ai-eng",
        name: "AI Engineering Fundamentals",
        description: "Core concepts for building reliable AI systems.",
        version: "1.0.0",
        tags: ["ai", "engineering", "evals"],
        branches: [{ intent: "learn evals", targetCourseId: "course-ai-evals" }],
    },
};

const MOCK_COURSES: Record<string, unknown> = {
    "course-ai-evals": {
        id: "course-ai-evals",
        skillId: "skill-ai-eng",
        title: "Reliable AI Systems",
        description: "From vibes to metrics.",
        lessonOrder: ["lesson-ai-evals", "lesson-rag-patterns", "lesson-tool-use"],
    },
};

// We import the seed curriculum for lesson data
import { seedCurriculum } from "../lib/data/seed-curriculum";
const LESSONS: unknown[] = seedCurriculum;

// ---- REPORT STRUCTURE ----------------------------------------------------

interface ValidationReport {
    errors: string[];
    warnings: string[];
}

// ---- VALIDATORS ----------------------------------------------------------

function validateSchemas(report: ValidationReport) {
    // Validate skill manifests
    for (const [id, raw] of Object.entries(MOCK_SKILLS)) {
        const result = SkillManifestSchema.safeParse(raw);
        if (!result.success) {
            for (const issue of result.error.issues) {
                report.errors.push(`[SCHEMA] Skill '${id}': ${issue.path.join(".")} — ${issue.message}`);
            }
        }
    }

    // Validate course manifests
    for (const [id, raw] of Object.entries(MOCK_COURSES)) {
        const result = CourseManifestSchema.safeParse(raw);
        if (!result.success) {
            for (const issue of result.error.issues) {
                report.errors.push(`[SCHEMA] Course '${id}': ${issue.path.join(".")} — ${issue.message}`);
            }
        }
    }

    // Validate lesson specs
    for (const raw of LESSONS) {
        const result = LessonSpecSchema.safeParse(raw);
        if (!result.success) {
            const id = (raw as any)?.id ?? "<unknown>";
            for (const issue of result.error.issues) {
                report.errors.push(`[SCHEMA] Lesson '${id}': ${issue.path.join(".")} — ${issue.message}`);
            }
        }
    }
}

function validateUniqueness(report: ValidationReport) {
    // Uniqueness rules:
    //   skillId:  globally unique
    //   courseId: globally unique
    //   lessonId: globally unique
    //   blockId:  unique WITHIN a lesson only

    const skillIds = new Set<string>();
    for (const id of Object.keys(MOCK_SKILLS)) {
        if (skillIds.has(id)) {
            report.errors.push(`[UNIQUENESS] Duplicate skillId: '${id}'`);
        }
        skillIds.add(id);
    }

    const courseIds = new Set<string>();
    for (const id of Object.keys(MOCK_COURSES)) {
        if (courseIds.has(id)) {
            report.errors.push(`[UNIQUENESS] Duplicate courseId: '${id}'`);
        }
        courseIds.add(id);
    }

    const lessonIds = new Set<string>();
    for (const raw of LESSONS) {
        const lesson = raw as LessonSpec;
        const id = lesson.id;
        if (lessonIds.has(id)) {
            report.errors.push(`[UNIQUENESS] Duplicate lessonId: '${id}'`);
        }
        lessonIds.add(id);

        // blockId unique within lesson
        const blockIds = new Set<string>();
        const allBlocks = [
            ...(lesson.stages.plan.blocks ?? []),
            ...(lesson.stages.do.blocks ?? []),
            ...(lesson.stages.check.blocks ?? []),
            ...(lesson.stages.act.blocks ?? []),
        ];
        for (const block of allBlocks) {
            if (blockIds.has(block.id)) {
                report.errors.push(
                    `[UNIQUENESS] Duplicate blockId '${block.id}' within lesson '${id}'`
                );
            }
            blockIds.add(block.id);
        }
    }
}

function validateDanglingRefs(report: ValidationReport) {
    const courseMap = MOCK_COURSES as Record<string, CourseManifest>;
    const lessonIds = new Set((LESSONS as LessonSpec[]).map((l) => l.id));
    const skillIds = new Set(Object.keys(MOCK_SKILLS));

    // Check course → skill refs
    for (const [courseId, course] of Object.entries(courseMap)) {
        const parsed = CourseManifestSchema.safeParse(course);
        if (!parsed.success) continue; // schema errors already reported
        if (!skillIds.has(parsed.data.skillId)) {
            report.errors.push(
                `[DANGLING] Course '${courseId}' references unknown skillId '${parsed.data.skillId}'`
            );
        }
        // Check course → lesson refs
        for (const lessonId of parsed.data.lessonOrder) {
            if (!lessonIds.has(lessonId)) {
                report.errors.push(
                    `[DANGLING] Course '${courseId}' references unknown lessonId '${lessonId}'`
                );
            }
        }
    }

    // Check skill → branch refs (targetCourseId)
    for (const [skillId, raw] of Object.entries(MOCK_SKILLS)) {
        const parsed = SkillManifestSchema.safeParse(raw);
        if (!parsed.success) continue;
        for (const branch of parsed.data.branches ?? []) {
            if (!Object.keys(MOCK_COURSES).includes(branch.targetCourseId)) {
                report.warnings.push(
                    `[DANGLING] Skill '${skillId}' branch references unknown courseId '${branch.targetCourseId}'`
                );
            }
        }
    }

    // Check prerequisite skill refs
    for (const [skillId, raw] of Object.entries(MOCK_SKILLS)) {
        const parsed = SkillManifestSchema.safeParse(raw);
        if (!parsed.success) continue;
        for (const prereq of parsed.data.prerequisites ?? []) {
            if (!skillIds.has(prereq)) {
                report.warnings.push(
                    `[DANGLING] Skill '${skillId}' prerequisite references unknown skillId '${prereq}'`
                );
            }
        }
    }
}

// ---- MAIN ----------------------------------------------------------------

function main() {
    const report: ValidationReport = { errors: [], warnings: [] };

    console.log("🔍  validate:skills — running checks...\n");

    validateSchemas(report);
    validateUniqueness(report);
    validateDanglingRefs(report);

    const hasErrors = report.errors.length > 0;
    const hasWarnings = report.warnings.length > 0;

    if (hasErrors) {
        console.error("ERRORS:");
        for (const e of report.errors) {
            console.error(`  ✖ ${e}`);
        }
        console.error();
    }

    if (hasWarnings) {
        console.warn("WARNINGS:");
        for (const w of report.warnings) {
            console.warn(`  ⚠ ${w}`);
        }
        console.warn();
    }

    if (!hasErrors && !hasWarnings) {
        console.log("✅  All checks passed. No errors or warnings.");
    } else if (!hasErrors) {
        console.log(`✅  Passed with ${report.warnings.length} warning(s).`);
    } else {
        console.log(`❌  Failed: ${report.errors.length} error(s), ${report.warnings.length} warning(s).`);
        process.exit(1);
    }
}

main();
