# Architecture Constitution

This document defines the core rules and invariants of the LearnIO system.
Any AI agent or engineer modifying this codebase MUST follow these rules.

## 1. Event-Sourced Invariants (DO NOT VIOLATE)

1.  **Source of Truth:** The Event Store (`lib/events/store.ts`) is the single source of truth for all dynamic state.
    *   **Rule:** Never store derived state (e.g., "current confidence", "progress percentage") as primary data. Always derive it from the event log.
    *   **Rule:** Replaying the same sequence of events MUST produce the exact same read models.

2.  **Pure Commands:** Commands (`lib/commands/index.ts`) are pure functions.
    *   **Rule:** Commands validate input and RETURN an array of `DomainEvent` objects.
    *   **Rule:** Commands do NOT read from the store, write to the store, or perform side effects (like API calls).
    *   **Rule:** Commands encapsulate all business logic for state transitions.

3.  **Deterministic Read Models:** Read models are projections of the event log.
    *   **Rule:** Read models are updated only by processing new events.
    *   **Rule:** Read models are ephemeral (in the sandbox) or cached (in production), but never authoritative.

## 2. Separation of Concerns

1.  **UI Layer (`app/*`):**
    *   **Rule:** UI components render data from read models (via hooks).
    *   **Rule:** UI components dispatch commands to the `DataClient`.
    *   **Rule:** UI components NEVER contain business logic for calculating confidence, stability, or progression.

2.  **PDCA Logic (`lib/pdca/*`):**
    *   **Rule:** The PDCA state machine logic lives exclusively in `lib/pdca/reducer.ts`.
    *   **Rule:** Stage transitions and validation rules are defined in the reducer, not in the UI.

3.  **Data Layer (`lib/data/*`):**
    *   **Rule:** The `DataClient` interface abstracts the data source (Mock vs. API).
    *   **Rule:** The client handles the mechanics of sending commands and fetching read models, but does not enforce business rules.

## 3. Content Pipeline Invariants

1.  **Research Provider:**
    *   **Rule:** Perplexity (or any research tool) is a `ResearchProvider` ONLY.
    *   **Rule:** The UI never communicates directly with the Research Provider.
    *   **Rule:** Research outputs are raw data (citations, summaries) used by the compiler, not final lesson content.

2.  **Lesson Compilation:**
    *   **Rule:** We compile research into a structured `LessonSpec`.
    *   **Rule:** The `LessonSpec` is the "bytecode" of the curriculum.
    *   **Rule:** The compiler is responsible for structuring, formatting, and validating the lesson content.

3.  **Versioning & Provenance:**
    *   **Rule:** Every generated lesson MUST store the version of the generator prompt/model used.
    *   **Rule:** Every research run MUST be stored and linked to the resulting lesson.
    *   **Rule:** Citations in the lesson MUST resolve to a valid source in the research data.

## 4. Validation Requirements

Before a lesson can be published or run:

1.  **Schema Validation:** The JSON must match the `LessonSpec` Zod schema.
2.  **Alignment Check:** Every exercise and check item must map to a specific learning objective.
3.  **Citation Coverage:** Every claim or fact block should have a citation (or be flagged for review).
4.  **PDCA Completeness:** The lesson must have valid content for all four PDCA stages.

## 5. Forbidden Patterns

*   **DO NOT:** Write to `localStorage` anywhere except the `EventStore`.
*   **DO NOT:** Calculate confidence scores inside a React component.
*   **DO NOT:** Fetch data in pages without going through the `DataClient` hooks.
*   **DO NOT:** Add stateful logic (like "if user has done X, then Y") to API route handlers. Use the Command pattern instead.
*   **DO NOT:** Hardcode lesson content in JSX. Use the `LessonSpec` renderer.

## 6. Safe Change Patterns

*   **Adding a New Event:** Define the event type in `lib/events/types.ts`, update the relevant command to emit it, and update read models to consume it.
*   **Modifying Confidence Logic:** Change the calculation in the *Command*, ensuring it remains deterministic based on inputs.
*   **Adding a New Lesson Block Type:** Update the `LessonSpec` schema, add a renderer component in the UI, and update the compiler to generate it.

## 7. Current Domain Events & Read Models (v1)

### Core Events
- `AttemptSubmitted`: Learner submitted a block (includes full provenance: `skillId`, `courseId`, `lessonId`, `blockId`).
- `ConfidenceUpdated`: Emitted by command when checking evidence.
- `CULoopClosed`: Full Plan-Do-Check-Act cycle completed.
- `BlockInteracted`: General block usage log (e.g. focused, typed).
- `HintRevealed`: Learner clicked a hint.
- `LessonCompleted`: Learner passed validation for all required blocks.

### Core Read Models
- `CourseProgress`: Determines `percentComplete` and next lesson from completed lesson events and course manifest `lessonOrder`.
- `SkillMastery`: Derives novice/competent/expert traits from course completions.
- `PracticeQueue`: Spaced repetition model isolating hint usage, staleness, and regressions to schedule review tasks.
- `StalenessReport`: Tracks `staleAfter` thresholds on published lessons vs `now` to prompt refreshes.
