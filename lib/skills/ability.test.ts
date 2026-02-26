import { describe, it, expect } from "vitest";
import {
    parseAbilityDefinition,
    safeParseAbilityDefinition,
    AbilityDefinitionSchema,
    MOCK_ABILITIES,
} from "./ability";

// ---------------------------------------------------------------------------
// F1 · ability.md Schema Tests
// ---------------------------------------------------------------------------

describe("AbilityDefinition schema", () => {
    const validAbility = {
        skillId: "skill-test",
        name: "Test Skill",
        description: "A test skill for validation.",
        version: "1.0.0",
        scopeTags: ["test"],
        branches: [
            {
                intent: "learn basics",
                targetCourseId: "course-basics",
                keywords: ["basics", "intro"],
                description: "Route learners to introductory content.",
            },
        ],
        guard: {
            requiredSkillIds: [],
            minimumMastery: "novice" as const,
        },
    };

    it("parses a valid ability definition", () => {
        const result = parseAbilityDefinition(validAbility);
        expect(result.skillId).toBe("skill-test");
        expect(result.branches).toHaveLength(1);
        expect(result.branches[0].targetCourseId).toBe("course-basics");
    });

    it("applies defaults for optional fields", () => {
        const minimal = {
            skillId: "skill-min",
            name: "Minimal",
            description: "Minimal skill.",
            branches: [
                { intent: "learn something", targetCourseId: "course-x" },
            ],
        };
        const result = parseAbilityDefinition(minimal);
        expect(result.version).toBe("1.0.0");
        expect(result.scopeTags).toEqual([]);
        expect(result.branches[0].keywords).toEqual([]);
    });

    it("rejects a definition with no branches", () => {
        expect(() =>
            parseAbilityDefinition({ ...validAbility, branches: [] })
        ).toThrow();
    });

    it("rejects a definition with missing skillId", () => {
        const { skillId: _unused, ...rest } = validAbility;
        expect(() => parseAbilityDefinition(rest)).toThrow();
    });

    it("rejects a definition with missing name", () => {
        expect(() =>
            parseAbilityDefinition({ ...validAbility, name: "" })
        ).toThrow();
    });

    it("rejects a branch with empty intent", () => {
        expect(() =>
            parseAbilityDefinition({
                ...validAbility,
                branches: [{ intent: "", targetCourseId: "course-x" }],
            })
        ).toThrow();
    });

    it("rejects an invalid minimumMastery value", () => {
        expect(() =>
            parseAbilityDefinition({
                ...validAbility,
                guard: { requiredSkillIds: [], minimumMastery: "wizard" },
            })
        ).toThrow();
    });

    it("safeParseAbilityDefinition returns null on invalid input", () => {
        const result = safeParseAbilityDefinition({ not: "valid" });
        expect(result).toBeNull();
    });

    it("safeParseAbilityDefinition returns parsed value on valid input", () => {
        const result = safeParseAbilityDefinition(validAbility);
        expect(result).not.toBeNull();
        expect(result?.skillId).toBe("skill-test");
    });
});

describe("MOCK_ABILITIES", () => {
    it("skill-ai-eng ability is valid", () => {
        const ability = MOCK_ABILITIES["skill-ai-eng"];
        expect(ability).toBeDefined();
        expect(ability.skillId).toBe("skill-ai-eng");
        expect(ability.branches.length).toBeGreaterThanOrEqual(1);
    });

    it("all mock abilities pass full schema validation", () => {
        for (const [key, ability] of Object.entries(MOCK_ABILITIES)) {
            const parsed = AbilityDefinitionSchema.safeParse(ability);
            expect(parsed.success, `Ability "${key}" should be valid`).toBe(true);
        }
    });

    it("branches reference non-empty courseIds", () => {
        for (const ability of Object.values(MOCK_ABILITIES)) {
            for (const branch of ability.branches) {
                expect(branch.targetCourseId).toBeTruthy();
            }
        }
    });
});
