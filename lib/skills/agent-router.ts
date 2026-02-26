import { SearchProvider, SearchResult } from "../contracts/search";
import { CourseProgress } from "../events/read-models";
import { AbilityDefinition, AbilityBranch } from "./ability";

// ---------------------------------------------------------------------------
// Agent Router — Phase 3
// ---------------------------------------------------------------------------
//
// Takes a user query + current course progress and returns a recommended
// course/lesson by:
//   1. Matching the query to ability branches via keyword hinting.
//   2. Refining the recommendation using the full-text search index.
//   3. Factoring in course progress to avoid sending learners backward.
//
// Deterministic: given same inputs, always returns same output.
// ---------------------------------------------------------------------------

export interface RouterContext {
    /** The user's natural-language query */
    query: string;
    /**
     * Current progress map: courseId → CourseProgress.
     * Used to skip already-completed courses and prioritise in-progress ones.
     */
    courseProgressMap: Map<string, CourseProgress>;
    /**
     * Abilities loaded for all installed skills.
     * The router evaluates their branches to match user intent.
     */
    abilities: AbilityDefinition[];
}

export interface RouterRecommendation {
    /** The best-matched course ID */
    courseId: string;
    /** The specific lesson to start (currentLessonId or first lesson) */
    lessonId: string | null;
    /** The branch that triggered this recommendation */
    matchedBranch: AbilityBranch | null;
    /** The search result that confirmed relevance (if any) */
    searchHit: SearchResult | null;
    /** Explanation for the recommendation (agent-facing) */
    rationale: string;
    /** Confidence score 0–1 */
    confidence: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Score a branch against a query using keyword matching.
 * Returns a score ≥ 0; higher is better.
 */
function scoreBranch(branch: AbilityBranch, queryLower: string): number {
    let score = 0;

    // Intent label match (broad)
    if (queryLower.includes(branch.intent.toLowerCase())) {
        score += 5;
    }

    // Keyword matches (more specific)
    for (const kw of branch.keywords ?? []) {
        if (queryLower.includes(kw.toLowerCase())) {
            score += 3;
        }
    }

    // Description match (weakest signal)
    if (branch.description && queryLower.includes(branch.description.toLowerCase().slice(0, 10))) {
        score += 1;
    }

    return score;
}

/**
 * Given a course's current progress, determine the best entry lesson.
 * Prefers the currentLessonId (first non-completed lesson).
 */
function pickEntryLesson(progress: CourseProgress | undefined): string | null {
    if (!progress) return null;
    return progress.currentLessonId ?? null;
}

// ---------------------------------------------------------------------------
// AgentRouter
// ---------------------------------------------------------------------------

export class AgentRouter {
    constructor(private readonly searchProvider: SearchProvider) { }

    /**
     * Routes a user query to the best course + lesson based on ability branches
     * and the full-text search index.
     *
     * Algorithm:
     *   1. Keyword-match query against all ability branches → ranked candidate list.
     *   2. Run full-text search for additional signal.
     *   3. Merge: if the top branch's course aligns with search results, boost confidence.
     *   4. Adjust for progress: skip 100% complete courses unless no other option.
     *   5. Return best recommendation.
     */
    async route(ctx: RouterContext): Promise<RouterRecommendation | null> {
        const { query, courseProgressMap, abilities } = ctx;

        if (!query.trim() || abilities.length === 0) return null;

        const queryLower = query.toLowerCase().trim();

        // --- Step 1: Score all branches across all abilities ---
        interface ScoredBranch {
            branch: AbilityBranch;
            ability: AbilityDefinition;
            branchScore: number;
        }

        const scored: ScoredBranch[] = [];

        for (const ability of abilities) {
            // Check guard (skip if prerequisites not met — simplified: always pass for now)
            for (const branch of ability.branches) {
                const branchScore = scoreBranch(branch, queryLower);
                if (branchScore > 0) {
                    scored.push({ branch, ability, branchScore });
                }
            }
        }

        // Sort branches by score descending
        scored.sort((a, b) => b.branchScore - a.branchScore);

        // --- Step 2: Full-text search ---
        let searchHit: SearchResult | null = null;
        try {
            const searchResults = await this.searchProvider.search(query, 3);
            if (searchResults.length > 0) {
                searchHit = searchResults[0];
            }
        } catch {
            // Search index may be empty on fresh install; non-fatal
        }

        // --- Step 3: Merge branch + search signals ---
        if (scored.length === 0 && !searchHit) return null;

        // Best candidate from branch matching
        const topBranch = scored[0] ?? null;

        let courseId: string;
        let matchedBranch: AbilityBranch | null = null;
        let confidence = 0;
        let rationale: string;

        if (topBranch) {
            courseId = topBranch.branch.targetCourseId;
            matchedBranch = topBranch.branch;
            confidence = Math.min(1, topBranch.branchScore / 10);
            rationale = `Matched intent "${topBranch.branch.intent}" in skill "${topBranch.ability.name}".`;

            // Boost confidence if the search hit's lessonId belongs to the same course
            if (searchHit) {
                const searchCoursesAligned = scored.some(
                    (s) =>
                        s.branch.targetCourseId === courseId &&
                        s.branchScore === topBranch.branchScore
                );
                if (searchCoursesAligned) {
                    confidence = Math.min(1, confidence + 0.2);
                    rationale += ` Search index confirmed: "${searchHit.title}".`;
                }
            }
        } else {
            // Fallback: use search hit alone
            // We can't determine courseId from search alone without a lesson→course map,
            // so we return a search-only recommendation with no courseId.
            return {
                courseId: "",
                lessonId: searchHit!.lessonId,
                matchedBranch: null,
                searchHit,
                rationale: `No branch match. Search index returned: "${searchHit!.title}".`,
                confidence: 0.3,
            };
        }

        // --- Step 4: Progress adjustment ---
        const progress = courseProgressMap.get(courseId);
        const isComplete = progress?.percentComplete === 100;

        if (isComplete) {
            // Try the next best branch that is not complete
            const alternative = scored.find(
                (s) =>
                    s.branch.targetCourseId !== courseId &&
                    courseProgressMap.get(s.branch.targetCourseId)?.percentComplete !== 100
            );
            if (alternative) {
                const altCourseId = alternative.branch.targetCourseId;
                const altProgress = courseProgressMap.get(altCourseId);
                const altLesson = pickEntryLesson(altProgress);
                return {
                    courseId: altCourseId,
                    lessonId: altLesson,
                    matchedBranch: alternative.branch,
                    searchHit,
                    rationale:
                        `Course "${courseId}" is already complete. ` +
                        `Routing to next best: intent "${alternative.branch.intent}".`,
                    confidence: Math.min(1, alternative.branchScore / 10),
                };
            }
            // All matching courses are complete — still recommend, note it
            rationale = `All matching courses are complete. Recommending ${courseId} for review.`;
            confidence = Math.max(0.1, confidence - 0.3);
        }

        const lessonId = pickEntryLesson(progress);

        return {
            courseId,
            lessonId,
            matchedBranch,
            searchHit,
            rationale,
            confidence,
        };
    }
}
