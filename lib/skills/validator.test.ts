import { describe, it, expect } from "vitest";
import { validateBundle } from "./validator";

describe("validateBundle", () => {
    it("passes given perfectly valid collections", () => {
        const skills = [
            {
                id: "skill-1",
                name: "Test Skill",
                description: "Test",
                version: "1.0.0",
                tags: ["test"],
                branches: [{ intent: "foo", targetCourseId: "course-1" }],
            },
        ];
        const courses = [
            {
                id: "course-1",
                skillId: "skill-1",
                title: "Test Course",
                description: "Test Course",
                lessonOrder: ["lesson-1"],
            },
        ];
        const lessons = [
            {
                id: "lesson-1",
                version: "1.0",
                schemaVersion: "1.0.0",
                title: "Lesson",
                topic: "Topic",
                description: "Desc",
                difficulty: "beginner",
                estimatedDuration: 10,
                tags: ["t"],
                capabilityIds: ["c1"],
                cuIds: ["cu1"],
                stages: {
                    plan: { blocks: [] },
                    do: { blocks: [{ id: "b1", type: "todo", text: "t" }] },
                    check: { blocks: [] },
                    act: { blocks: [] },
                },
            },
        ];

        const report = validateBundle(skills, courses, lessons);
        expect(report.errors).toHaveLength(0);
        expect(report.warnings).toHaveLength(0);
    });

    it("flags dangling course refs to skills", () => {
        const courses = [
            {
                id: "c1",
                skillId: "missing-skill",
                title: "T",
                description: "D",
                lessonOrder: [],
            },
        ];
        const report = validateBundle([], courses, []);
        expect(report.errors).toContain("[DANGLING] Course 'c1' references unknown skillId 'missing-skill'");
    });

    it("flags dangling course refs to lessons", () => {
        const skills = [
            { id: "s1", name: "S", description: "D", version: "1.0.0", tags: [], branches: [] },
        ];
        const courses = [
            {
                id: "c1",
                skillId: "s1",
                title: "T",
                description: "D",
                lessonOrder: ["missing-lesson"],
            },
        ];
        const report = validateBundle(skills, courses, []);
        expect(report.errors).toContain("[DANGLING] Course 'c1' references unknown lessonId 'missing-lesson'");
    });

    it("flags duplicate skill IDs, course IDs, and lesson IDs", () => {
        const skill = { id: "s1", name: "S", description: "D", version: "1.0.0", tags: [], branches: [] };
        const course = { id: "c1", skillId: "s1", title: "T", description: "D", lessonOrder: [] };
        const lesson = {
            id: "l1",
            version: "1.0",
            schemaVersion: "1.0.0",
            title: "L",
            topic: "T",
            description: "D",
            difficulty: "beginner",
            estimatedDuration: 10,
            tags: [],
            capabilityIds: [],
            cuIds: [],
            stages: { plan: { blocks: [] }, do: { blocks: [] }, check: { blocks: [] }, act: { blocks: [] } },
        };

        const report = validateBundle([skill, skill], [course, course], [lesson, lesson]);
        expect(report.errors).toContain("[UNIQUENESS] Duplicate skillId: 's1'");
        expect(report.errors).toContain("[UNIQUENESS] Duplicate courseId: 'c1'");
        expect(report.errors).toContain("[UNIQUENESS] Duplicate lessonId: 'l1'");
    });

    it("flags duplicate block IDs within the same lesson", () => {
        const lesson = {
            id: "l1",
            version: "1.0",
            schemaVersion: "1.0.0",
            title: "L",
            topic: "T",
            description: "D",
            difficulty: "beginner",
            estimatedDuration: 10,
            tags: [],
            capabilityIds: [],
            cuIds: [],
            stages: {
                plan: { blocks: [{ id: "b1", type: "todo", text: "t1" }] },
                do: { blocks: [{ id: "b1", type: "todo", text: "t2" }] },
                check: { blocks: [] },
                act: { blocks: [] },
            },
        };
        const report = validateBundle([], [], [lesson]);
        expect(report.errors).toContain("[UNIQUENESS] Duplicate blockId 'b1' within lesson 'l1'");
    });

    it("flags dangling branch refs as warnings", () => {
        const skill = {
            id: "s1",
            name: "S",
            description: "D",
            version: "1.0.0",
            tags: [],
            branches: [{ intent: "i", targetCourseId: "missing-course" }],
        };
        const report = validateBundle([skill], [], []);
        expect(report.warnings).toContain("[DANGLING] Skill 's1' branch references unknown courseId 'missing-course'");
    });
});
