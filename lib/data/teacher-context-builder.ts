import { LessonSpec, LessonBlock, Citation } from "../contracts/lesson";
import { DomainEvent } from "../events/types";
import { TeacherContext } from "../contracts/teacher";

/**
 * Builds a scoped TeacherContext for a specific block within a lesson.
 * Pure function — No store access, no side effects, no Date.now().
 *
 * @param lesson  - The full LessonSpec
 * @param blockId - ID of the block the learner is currently on
 * @param events  - Full event log (filtered internally to this lesson + block)
 */
export function buildTeacherContext(
    lesson: LessonSpec,
    blockId: string,
    events: DomainEvent[]
): TeacherContext {
    // --- Find the block ---
    const block = findBlockById(lesson, blockId);
    if (!block) {
        throw new Error(
            `buildTeacherContext: block "${blockId}" not found in lesson "${lesson.id}"`
        );
    }

    // --- Count hints used for this specific block ---
    // "How many hints revealed" = count of HintRevealed events where payload.lessonId and blockId match
    const hintsRevealed = events.reduce((count, event) => {
        if (
            event.type === "HintRevealed" &&
            event.payload.lessonId === lesson.id &&
            event.payload.blockId === blockId
        ) {
            return count + 1;
        }
        return count;
    }, 0);

    // --- Extract latest attempt inputs for this block ---
    // "latest attempt" = last AttemptSubmitted where payload.lessonId===lesson.id AND blockId===blockId
    // Events are assumed to be in chronological order (earliest first).
    let learnerAttempt: Record<string, any> | null = null;
    for (const event of events) {
        if (
            event.type === "AttemptSubmitted" &&
            event.payload.lessonId === lesson.id &&
            (event.payload as any).blockId === blockId
        ) {
            learnerAttempt = event.payload.inputs;
        }
    }

    // --- Build rubric from block remediationTargets ---
    const rubric = block.remediationTargets ?? [];

    // --- Build hint ladder from exercise blocks ---
    const hintLadder = block.type === "exercise" ? block.hints : [];

    // --- Scope citations to this block ---
    // Strategy: include citations referenced in the block's content (best-effort text search)
    // or return all lesson citations as context (safe fallback since we don't have per-block citation refs)
    const allCitations = lesson.citations ?? [];
    const citations = scopeCitationsToBlock(block, allCitations);

    return {
        blockContent: block,
        learnerAttempt,
        rubric,
        hintLadder,
        hintsRevealed,
        citations,
    };
}

// --- Private Helpers ---

/**
 * Searches all PDCA stages of a lesson for a block by ID.
 */
function findBlockById(lesson: LessonSpec, blockId: string): LessonBlock | null {
    const stages: Array<keyof typeof lesson.stages> = ["plan", "do", "check", "act"];
    for (const stage of stages) {
        const block = lesson.stages[stage].blocks.find((b) => b.id === blockId);
        if (block) return block;
    }
    return null;
}

/**
 * Attempts to filter citations to those relevant to the given block.
 * Current strategy: includes all citations (since block schema does not store citation refs).
 * When block-level citation IDs are added to the schema, update this function.
 */
function scopeCitationsToBlock(block: LessonBlock, allCitations: Citation[]): Citation[] {
    // Future: if block has `citationIds?: string[]`, filter here.
    // For now, provide full context so the teacher never hallucinates missing sources.
    return allCitations;
}
