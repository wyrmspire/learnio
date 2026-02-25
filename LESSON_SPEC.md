# Lesson Spec

The `LessonSpec` is the core data structure for the LearnIO curriculum. It defines a structured, interactive lesson that can be rendered by the Learn Runner.

## 1. Schema Overview

A `LessonSpec` is a JSON object with the following high-level structure:

```typescript
interface LessonSpec {
  id: string;
  title: string;
  description: string;
  version: string;
  schemaVersion: "1.0.0";
  
  // Metadata
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number; // minutes
  prerequisites: string[]; // IDs of other lessons/CUs
  
  // Content
  stages: {
    plan: PlanStage;
    do: DoStage;
    check: CheckStage;
    act: ActStage;
  };
  
  // Provenance
  researchRunId: string;
  generatorModel: string;
  citations: Citation[];
}
```

## 2. Stage Definitions

### Plan Stage
*   **Goal:** Establish a mental model and make a prediction.
*   **Blocks:**
    *   `ExplainerBlock`: Markdown text, diagrams, code snippets.
    *   `ConceptCheck`: Simple multiple-choice question to verify understanding.
    *   `PredictionPrompt`: A specific question asking the user to predict an outcome.

### Do Stage
*   **Goal:** Apply the mental model to a concrete problem.
*   **Blocks:**
    *   `ScenarioBlock`: Description of a problem or situation.
    *   `InteractiveExercise`: A code editor, diagram builder, or multiple-choice diagnosis tool.
    *   `HintLadder`: A sequence of progressive hints available to the user.

### Check Stage
*   **Goal:** Verify the result and correct misconceptions.
*   **Blocks:**
    *   `ResultReveal`: The correct answer/outcome.
    *   `SelfCorrection`: A prompt asking the user to compare their prediction/action with the result.
    *   `RetrievalPractice`: Questions to reinforce the key concepts.

### Act Stage
*   **Goal:** Reflect and transfer knowledge.
*   **Blocks:**
    *   `ReflectionPrompt`: Open-ended text area for synthesis.
    *   `TransferTask`: A related but different problem to test generalization.
    *   `Commitment`: A prompt for a future action or behavior change.

## 3. Rendering Contract

The UI Renderer (`app/learn/components/LessonRenderer.tsx`) is "dumb". It:
1.  Takes a `LessonSpec` and the current `PDCAState`.
2.  Renders the blocks for the current stage.
3.  Dispatches user interactions (e.g., `submitAnswer`, `revealHint`) as commands.
4.  Displays feedback based on the command result.

**It does NOT:**
*   Contain lesson content.
*   Decide if an answer is correct (that logic lives in the Command or a specialized Evaluator).
*   Manage the PDCA state transitions (that lives in the Reducer).

## 4. Interactive Teacher Chat

The "Teacher Chat" is NOT a freeform chatbot. It is a context-aware coach.

*   **Constraint:** The chat context is limited to:
    1.  The current `LessonSpec` block.
    2.  The user's recent telemetry (events).
    3.  The specific misconception tags associated with the current exercise.
*   **Behavior:** It asks Socratic questions, points to specific parts of the lesson, or offers encouragement. It does *not* answer unrelated questions.

## 5. Evaluation & Events

Evaluation logic (whether hardcoded or LLM-based) emits standard events:

*   `RubricScored`: When a complex input is graded against a rubric.
*   `MisconceptionTagged`: When a specific error pattern is detected.
*   `ConfidenceUpdated`: When the system adjusts the user's mastery score (with a `reason`).
*   `HintUsed`: When the user requests a hint.

## 6. Lifecycle

1.  **Draft:** Lesson is being generated or edited. Not visible to learners.
2.  **Validated:** Lesson has passed schema and alignment checks.
3.  **Published:** Lesson is live and versioned. Immutable.
4.  **Archived:** Lesson is replaced by a newer version.

**Rollback:** Since lessons are immutable and versioned, rolling back is simply pointing the "current" pointer to a previous version ID.
