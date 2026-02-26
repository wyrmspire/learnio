import { LessonBlock, Citation } from "./lesson";

// --- Teacher Context ---

/**
 * Scoped context for a teacher/AI assistant responding to a specific block.
 * Built by `buildTeacherContext()` — a pure function, no store access.
 */
export interface TeacherContext {
    blockContent: LessonBlock;                  // The current block being taught
    learnerAttempt: Record<string, any> | null; // Latest attempt inputs for this specific block
    rubric: string[];                            // Remediation targets from the block schema
    hintLadder: string[];                        // Hint strings from exercise blocks (or [])
    hintsRevealed: number;                       // How many hints the learner has used
    citations: Citation[];                       // Lesson citations scoped to this block
}

// --- Teacher Response ---

export interface TeacherResponse {
    type: "hint" | "socratic_question" | "remediation";
    content: string;
}
