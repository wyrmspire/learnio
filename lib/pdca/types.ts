export type Stage = "plan" | "do" | "check" | "act";
export type StageStatus = "locked" | "active" | "completed";

export interface PDCAState {
  currentStage: Stage;
  stages: Record<Stage, StageStatus>;
  prediction: string;
  diagnosis: string;
  reflection: string;
}

export type PDCAAction =
  | { type: "UPDATE_PREDICTION"; payload: string }
  | { type: "COMMIT_PREDICTION" }
  | { type: "SUBMIT_DIAGNOSIS"; payload: string }
  | { type: "COMPLETE_CHECK" }
  | { type: "UPDATE_REFLECTION"; payload: string }
  | { type: "CLOSE_LOOP" }
  | { type: "JUMP_TO_STAGE"; payload: Stage }
  // New Events
  | { type: "BLOCK_INTERACTED"; payload: { blockId: string; interaction: any } }
  | { type: "HINT_REVEALED"; payload: { blockId: string; hintIndex: number } }
  | { type: "LESSON_COMPLETED"; payload: { skillId?: string; courseId?: string; lessonId: string } };
