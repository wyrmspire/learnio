import { z } from "zod";

// ---------------------------------------------------------------------------
// ability.md Schema — Phase 3 Skill Bundle Extension
// ---------------------------------------------------------------------------
//
// An `ability.md` file lives inside a skill bundle at:
//   /skills/<skillId>/ability.md
//
// It defines the scope and branching rules for AI agents that hold this skill.
// Agents consult these definitions to route user queries to the correct course
// or lesson, and to understand the intent boundaries of the skill.
//
// YAML front-matter + markdown body is the canonical format for humans.
// The parsed form below is what goes into code.
// ---------------------------------------------------------------------------

/**
 * A single branching rule: maps user intent patterns to a course.
 *
 * Example:
 *   - intent: "learn evals"
 *     targetCourseId: "course-ai-evals"
 *     keywords: ["eval", "metric", "deterministic"]
 */
export const AbilityBranchSchema = z.object({
    /** Human-readable intent label (used for routing display) */
    intent: z.string().min(1),
    /** The courseId that fulfils this intent */
    targetCourseId: z.string().min(1),
    /**
     * Optional keyword hints for lightweight routing decisions.
     * Higher specificity keywords take precedence in routing.
     */
    keywords: z.array(z.string()).optional().default([]),
    /**
     * Optional description surfaced to agents to decide which branch applies.
     */
    description: z.string().optional(),
});

export type AbilityBranch = z.infer<typeof AbilityBranchSchema>;

/**
 * Defines the learner state thresholds that an ability requires.
 * Guards prevent routing a learner to advanced content before prerequisites.
 */
export const AbilityGuardSchema = z.object({
    /** Required prerequisite skill IDs (must be at competent or above) */
    requiredSkillIds: z.array(z.string()).optional().default([]),
    /**
     * Minimum mastery level the learner must hold in all requiredSkillIds
     * before this ability's branches are offered.
     * Defaults to "novice" (no hard requirement).
     */
    minimumMastery: z
        .enum(["novice", "competent", "expert"])
        .optional()
        .default("novice"),
});

export type AbilityGuard = z.infer<typeof AbilityGuardSchema>;

/**
 * The top-level ability definition for a skill bundle.
 *
 * This maps 1:1 to the parsed front-matter + body of `ability.md`.
 */
export const AbilityDefinitionSchema = z.object({
    /** Unique identifier — must match the parent skillId */
    skillId: z.string().min(1),
    /** Human-readable name for agent display */
    name: z.string().min(1),
    /**
     * A short description (1–2 sentences) of what this skill enables the agent
     * to teach. Surfaced to the agent router to determine relevance.
     */
    description: z.string().min(1),
    /**
     * Branching rules: ordered list of intent → course mappings.
     * Router evaluates branches in order; first matching branch wins.
     */
    branches: z.array(AbilityBranchSchema).min(1),
    /** Optional guard conditions that restrict ability activation */
    guard: AbilityGuardSchema.optional(),
    /**
     * Optional list of scoped topic tags used by the search index to
     * narrow retrieval to relevant content.
     */
    scopeTags: z.array(z.string()).optional().default([]),
    /** Semver of this ability definition */
    version: z.string().default("1.0.0"),
});

export type AbilityDefinition = z.infer<typeof AbilityDefinitionSchema>;

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parses a plain JS object (e.g. from YAML front-matter + JSON fields) into
 * a validated AbilityDefinition.
 *
 * Usage:
 *   const raw = parseYamlFrontmatter(abilityMdContent);
 *   const ability = parseAbilityDefinition(raw);
 */
export function parseAbilityDefinition(raw: unknown): AbilityDefinition {
    return AbilityDefinitionSchema.parse(raw);
}

/**
 * Safe variant that returns null on validation failure.
 * Use in loaders where a missing ability.md should be non-fatal.
 */
export function safeParseAbilityDefinition(
    raw: unknown
): AbilityDefinition | null {
    const result = AbilityDefinitionSchema.safeParse(raw);
    return result.success ? result.data : null;
}

// ---------------------------------------------------------------------------
// MOCK ABILITY DATA (mirrors MOCK_SKILLS in loader.ts)
// ---------------------------------------------------------------------------

/**
 * Inline ability definition for skill-ai-eng.
 * In production this would be read from /skills/ai-engineering/ability.md.
 */
export const MOCK_ABILITIES: Record<string, AbilityDefinition> = {
    "skill-ai-eng": parseAbilityDefinition({
        skillId: "skill-ai-eng",
        name: "AI Engineering Fundamentals",
        description:
            "Teaches learners to build reliable AI systems: evals, RAG architecture, tool use, and agency patterns.",
        version: "1.0.0",
        scopeTags: ["ai", "engineering", "evals", "rag", "agents", "tools"],
        branches: [
            {
                intent: "learn evals",
                targetCourseId: "course-ai-evals",
                keywords: ["eval", "metric", "deterministic", "vibes", "scoring"],
                description:
                    "Route learners asking about evaluation, metrics, or testing AI models.",
            },
            {
                intent: "learn rag",
                targetCourseId: "course-ai-evals",
                keywords: ["rag", "retrieval", "search", "vector", "embedding"],
                description:
                    "Route learners asking about RAG pipelines, hybrid search, or re-ranking.",
            },
            {
                intent: "learn tool use",
                targetCourseId: "course-ai-evals",
                keywords: ["tool", "agent", "function calling", "json schema", "agency"],
                description:
                    "Route learners asking about tool use, function calling, or agentic patterns.",
            },
        ],
        guard: {
            requiredSkillIds: [],
            minimumMastery: "novice",
        },
    }),
    "skill-cnc-machinist": parseAbilityDefinition({
        skillId: "skill-cnc-machinist",
        name: "Job Shop CNC Machinist",
        description:
            "Teaches learners manual machining foundations, precision grinding, heat treating, engineering print reading, and introduction to CNC programming.",
        version: "1.0.0",
        scopeTags: ["machining", "cnc", "manufacturing", "manual", "grinding", "heat-treat", "print-reading", "blueprint"],
        branches: [
            {
                intent: "learn manual machining",
                targetCourseId: "course-manual-machining",
                keywords: ["manual", "chip", "safety", "rpm", "feed", "grind", "heat", "treat", "tempering", "hardening"],
                description:
                    "Route learners asking about manual machining basics, grinding, or heat treating.",
            },
            {
                intent: "read prints",
                targetCourseId: "course-cnc-fundamentals",
                keywords: ["print", "blueprint", "drawing", "orthographic", "feature", "callout", "axis"],
                description:
                    "Route learners asking about reading engineering drawings, feature recognition, or axis detection on prints.",
            },
            {
                intent: "learn cnc",
                targetCourseId: "course-cnc-fundamentals",
                keywords: ["cnc", "gcode", "g-code", "automation", "coordinate", "machine"],
                description:
                    "Route learners asking about CNC machines, G-code programming, or Cartesian coordinates.",
            },
        ],
        guard: {
            requiredSkillIds: [],
            minimumMastery: "novice",
        },
    }),
};
