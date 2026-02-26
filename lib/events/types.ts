export type EventType =
  | "AttemptSubmitted"
  | "HintUsed"
  | "StageCompleted"
  | "CULoopClosed"
  | "EvidenceGained"
  | "TransferTestPassed"
  | "ConfidenceUpdated"
  // New Events
  | "BlockInteracted"
  | "HintRevealed"
  | "LessonCompleted";

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: string;
  userId: string;
}

export interface AttemptSubmittedEvent extends BaseEvent {
  type: "AttemptSubmitted";
  payload: {
    cuId: string;
    skillId?: string;
    courseId?: string;
    lessonId?: string;
    blockId?: string;
    stage: string;
    inputs: Record<string, any>;
  };
}

export interface StageCompletedEvent extends BaseEvent {
  type: "StageCompleted";
  payload: {
    cuId: string;
    stage: string;
  };
}

export interface CULoopClosedEvent extends BaseEvent {
  type: "CULoopClosed";
  payload: {
    cuId: string;
    evidenceGained: boolean;
  };
}

export interface ConfidenceUpdatedEvent extends BaseEvent {
  type: "ConfidenceUpdated";
  payload: {
    cuId: string;
    delta: number;
    reason: "transfer_pass" | "hint_penalty" | "regression" | "spaced_recall" | "loop_closed";
  };
}

export interface BlockInteractedEvent extends BaseEvent {
  type: "BlockInteracted";
  payload: {
    lessonId: string;
    blockId: string;
    interaction: any;
  };
}

export interface HintRevealedEvent extends BaseEvent {
  type: "HintRevealed";
  payload: {
    lessonId: string;
    blockId: string;
    hintIndex: number;
  };
}

export interface LessonCompletedEvent extends BaseEvent {
  type: "LessonCompleted";
  payload: {
    skillId?: string;
    courseId?: string;
    lessonId: string;
  };
}

export type DomainEvent =
  | AttemptSubmittedEvent
  | StageCompletedEvent
  | CULoopClosedEvent
  | ConfidenceUpdatedEvent
  | BlockInteractedEvent
  | HintRevealedEvent
  | LessonCompletedEvent;
