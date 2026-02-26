import { describe, it, expect, beforeEach } from "vitest";
import { skillLoader } from "./loader";
import { lessonStore } from "../data/lesson-store";

describe("SkillLoader", () => {

    it("installs a skill and makes it available in the lesson store", async () => {
        // We mock validateBundle directly because the mock data has dangling refs (like prerequisites or courses not fully linked).
        // Actually, the seed data and mocks we provide should be valid if `npm run validate:skills` passes.

        // We expect the skill to install successfully since the mock curriculum itself is valid
        await skillLoader.installSkill("skill-ai-eng");

        // The mock data has the course "course-ai-evals" with "lesson-ai-evals"
        const publishedList = lessonStore.getAllPublishedLessons();
        expect(publishedList.length).toBeGreaterThan(0);

        const publishedVersion = lessonStore.getPublishedVersion("lesson-ai-evals");
        expect(publishedVersion).toBeDefined();
        expect(publishedVersion!.spec.id).toBe("lesson-ai-evals");
    });

    it("throws validation error if skill manifest is invalid or missing", async () => {
        await expect(skillLoader.installSkill("skill-nonexistent")).rejects.toThrow(/not found/);
    });
});
