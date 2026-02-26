import { describe, it, expect } from "vitest";
import { CurriculumBuildRequestSchema, CapabilityMapEntrySchema } from "../contracts/curriculum";
import { CurriculumBuilderStub } from "../data/curriculum-builder-stub";

describe("CurriculumBuildRequest Schema", () => {
    it("accepts a minimal valid request", () => {
        const parsed = CurriculumBuildRequestSchema.parse({
            skillId: "skill-rust-001",
            domain: "Rust Programming",
            maxTopics: 3,
        });
        expect(parsed.skillId).toBe("skill-rust-001");
        expect(parsed.maxTopics).toBe(3);
    });

    it("defaults maxTopics to 5", () => {
        const parsed = CurriculumBuildRequestSchema.parse({
            skillId: "skill-x",
            domain: "Python",
        });
        expect(parsed.maxTopics).toBe(5);
    });

    it("rejects maxTopics > 20", () => {
        expect(() =>
            CurriculumBuildRequestSchema.parse({
                skillId: "skill-x",
                domain: "Python",
                maxTopics: 21,
            })
        ).toThrow();
    });

    it("rejects missing skillId", () => {
        expect(() =>
            CurriculumBuildRequestSchema.parse({
                domain: "Python",
            })
        ).toThrow();
    });
});

describe("CapabilityMapEntry Schema", () => {
    it("accepts a valid entry", () => {
        const entry = CapabilityMapEntrySchema.parse({
            topic: "Rust Lifetimes",
            lessonId: "lesson-rust-lifetimes",
            compilerRunId: "run-abc",
            sequenceIndex: 0,
            published: false,
        });
        expect(entry.topic).toBe("Rust Lifetimes");
        expect(entry.published).toBe(false);
    });

    it("defaults published to false", () => {
        const entry = CapabilityMapEntrySchema.parse({
            topic: "Rust Lifetimes",
            lessonId: "lesson-rust-lifetimes",
            compilerRunId: "run-abc",
            sequenceIndex: 1,
        });
        expect(entry.published).toBe(false);
    });

    it("rejects negative sequenceIndex", () => {
        expect(() =>
            CapabilityMapEntrySchema.parse({
                topic: "x",
                lessonId: "lesson-x",
                compilerRunId: "run-1",
                sequenceIndex: -1,
            })
        ).toThrow();
    });
});

describe("CurriculumBuilderStub", () => {
    it("yields N entries when seedTopics provided", async () => {
        const builder = new CurriculumBuilderStub();
        const entries: import("../contracts/curriculum").CapabilityMapEntry[] = [];

        const req = {
            skillId: "skill-rust",
            domain: "Rust Programming",
            seedTopics: ["Ownership", "Lifetimes", "Traits"],
            maxTopics: 3,
        };

        for await (const entry of builder.build(req)) {
            entries.push(entry);
        }

        expect(entries).toHaveLength(3);
        expect(entries[0].topic).toBe("Ownership");
        expect(entries[0].sequenceIndex).toBe(0);
        expect(entries[2].sequenceIndex).toBe(2);
    });

    it("generates placeholder topics from domain when no seedTopics given", async () => {
        const builder = new CurriculumBuilderStub();
        const entries: import("../contracts/curriculum").CapabilityMapEntry[] = [];

        for await (const entry of builder.build({
            skillId: "skill-ml",
            domain: "Machine Learning",
            maxTopics: 2,
        })) {
            entries.push(entry);
        }

        expect(entries).toHaveLength(2);
        expect(entries[0].topic).toContain("Machine Learning");
    });

    it("derived lessonIds are stable slugs", async () => {
        const builder = new CurriculumBuilderStub();
        const entries: import("../contracts/curriculum").CapabilityMapEntry[] = [];

        for await (const entry of builder.build({
            skillId: "skill-rust",
            domain: "Rust",
            seedTopics: ["Rust Lifetimes & Borrows"],
            maxTopics: 1,
        })) {
            entries.push(entry);
        }

        expect(entries[0].lessonId).toBe("lesson-rust-lifetimes-borrows");
    });

    it("respects maxTopics cap on seedTopics", async () => {
        const builder = new CurriculumBuilderStub();
        const entries: import("../contracts/curriculum").CapabilityMapEntry[] = [];

        for await (const entry of builder.build({
            skillId: "skill-x",
            domain: "X",
            seedTopics: ["A", "B", "C", "D", "E"],
            maxTopics: 3,
        })) {
            entries.push(entry);
        }

        expect(entries).toHaveLength(3);
    });
});
