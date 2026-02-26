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

import { validateBundle, ValidationReport } from "../lib/skills/validator";

// ---- MAIN ----------------------------------------------------------------

function main() {
    console.log("🔍  validate:skills — running checks...\n");

    const report = validateBundle(
        Object.values(MOCK_SKILLS),
        Object.values(MOCK_COURSES),
        LESSONS
    );

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
