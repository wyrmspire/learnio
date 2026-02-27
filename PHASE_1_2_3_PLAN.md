# Phase 1: Content + "Skills" Packaging (Seed Bundles)

**Goal:** Introduce a first-class content packaging system under `/skills` that acts as **seed content** for the canonical Lesson Store.

## Requirements

1.  **Directory Structure (`/skills`):**
    *   `/skills/registry.json`: List of available skill bundles.
    *   `/skills/<skillId>/manifest.json`: Metadata (name, tags, prerequisites).
    *   `/skills/<skillId>/courses/*.json`: Course metadata and lesson ordering.
    *   `/skills/<skillId>/lessons/*.json`: Lesson content (matching `LessonSpec` schema).
    *   `/skills/<skillId>/assets/*`: Diagrams, snippets, etc.

2.  **Content Loader (`lib/skills/`):**
    *   Implement a loader that reads these files and **ingests** them into the `LessonStore` (mock DB).
    *   **Crucial:** The runtime app should load lessons from the `LessonStore` (by ID/Version), NOT directly from the file system. The `/skills` folder is just a distribution mechanism for seed content.

3.  **Validation CLI:**
    *   Create a script (`npm run validate:skills`) that checks schema correctness, ID uniqueness, and dangling references.
    *   **Constraint:** Validation must be deterministic.

4.  **Invariants:**
    *   Do NOT add business logic to UI.
    *   Keep event-sourced invariants intact.

## Phase 2: Progress + Course Cohesion

**Goal:** Make progress trackable per skill/course/lesson while keeping the system event-sourced.

## Requirements

1.  **Identity Plumbing:**
    *   Extend `Attempt` schema to include `skillId`, `courseId`, `lessonId`, `blockId`.

2.  **Domain Events:**
    *   Add `BlockInteracted` (with payload).
    *   Add `HintRevealed` (with index).
    *   Add `LessonCompleted`.
    *   **Correction:** Do NOT add an explicit `CourseAdvanced` event. Derive course progress from the primitive events in the read model.

3.  **Read Models:**
    *   Update `lib/events/read-models.ts` to compute:
        *   `courseProgress`: { percent, currentLessonId, completedLessonIds }
        *   `skillMastery`: Aggregated from course progress.

4.  **UI Updates:**
    *   Update `LearnSessionPage` to load the lesson from the URL params (`?lessonId=...`).
    *   Wire `LessonBlockRenderer` to dispatch commands that emit the new domain events.

## Phase 3: Agent Retrieval, Genkit Orchestration, + Future Abilities

**Goal:** Add an agent-friendly retrieval layer, "abilities" packaging, and Genkit-powered generative pipelines.

## Requirements

1.  **Abilities Definition:**
    *   Add `ability.md` to the skill bundle defining scope and branching rules.

2.  **Local Search Index:**
    *   Implement `LocalIndexSearchProvider` that indexes **published LessonVersions** from the store.
    *   **Constraint:** Do not index the raw file system directly; index the artifacts in the DB.

3.  **Genkit Orchestration:**
    *   Configure `lib/data/genkit.ts` using `@genkit-ai/googleai`.
    *   Migrate `StagedContentCompiler` to use Firebase Genkit flows for generation phases (brief, skeleton, blocks).
    *   Use Genkit's telemetry / developer UI for debugging agent execution and prompt regressions.

4.  **Agent Router:**
    *   Implement a router that takes a user query + current progress and returns a recommended lesson/course (orchestrated via Genkit actions).

5.  **Interfaces:**
    *   `SearchProvider`: For retrieval (Local now, Genkit action fetching Perplexity later).
    *   `ResearchProvider`: For generation.
