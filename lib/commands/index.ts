import { Attempt } from "../contracts/schemas";
import { DomainEvent } from "../events/types";

/**
 * COMMANDS
 *
 * Commands are pure functions.
 * They validate input and RETURN events.
 * They do not read or write state.
 */
export function submitAttemptCommand(attempt: Attempt): DomainEvent[] {
  const events: DomainEvent[] = [];
  const now = new Date().toISOString();

  // 1. Record the attempt
  events.push({
    id: `evt-${Date.now()}-1`,
    type: "AttemptSubmitted",
    timestamp: now,
    userId: attempt.userId,
    payload: { cuId: attempt.cuId, stage: attempt.stage, inputs: attempt.inputs }
  });

  // 2. If it's the final stage, close the loop and calculate confidence
  if (attempt.stage === "act") {
    // Deterministic heuristic: base delta + penalty for hints
    const baseDelta = 0.05;
    const hintPenalty = attempt.hintsUsed * 0.01;
    const finalDelta = Math.max(0.01, baseDelta - hintPenalty);

    events.push({
      id: `evt-${Date.now()}-2`,
      type: "ConfidenceUpdated",
      timestamp: now,
      userId: attempt.userId,
      payload: { 
        cuId: attempt.cuId, 
        delta: finalDelta,
        reason: attempt.hintsUsed > 0 ? "hint_penalty" : "loop_closed"
      }
    });

    events.push({
      id: `evt-${Date.now()}-3`,
      type: "CULoopClosed",
      timestamp: now,
      userId: attempt.userId,
      payload: { cuId: attempt.cuId, evidenceGained: true }
    });
  }

  return events;
}
