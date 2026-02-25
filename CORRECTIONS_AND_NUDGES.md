# Corrections and Nudges

This document identifies architectural gaps and proposes the next steps to transform the current learning engine into a content-driven platform.

## 1. Architectural Gaps (Current State)

*   **Lesson Content is Hardcoded:** The `LearnSessionPage` (`app/learn/page.tsx`) currently hardcodes the lesson content (text, diagrams, exercises) directly in JSX. This prevents dynamic lesson generation and storage.
*   **CapabilityUnit (CU) Overloading:** The `CapabilityUnit` schema is currently doing double duty as a "learning unit" metadata container and an implicit "lesson" container.
*   **Missing Content Pipeline:** There is no mechanism to generate, version, or store lesson content.
*   **Missing Teacher Context:** The system lacks a structured way to provide "teacher" guidance (hints, explanations) that is contextually aware of the specific lesson block.

## 2. Proposed Solution: LessonSpec

### Relationship: Capability vs. CU vs. LessonSpec

*   **Capability:** A high-level skill (e.g., "System Debugging").
*   **Capability Unit (CU):** A specific, measurable unit of that skill (e.g., "Diagnose Bottlenecks").
*   **LessonSpec:** The *executable content* that teaches a CU.
    *   **Proposal:** A CU *has one or more* LessonSpecs (versions).
    *   **Proposal:** The `LessonSpec` is the "bytecode" that the runner executes. It is linked to a CU ID but stored separately.

### Minimal Storage Layer (Mock Mode)

We need a lightweight way to store generated lessons without a full DB.

*   **`lib/data/lessons.ts` (Mock DB):**
    *   `lesson_versions`: A map of `lessonId` -> `LessonSpec`.
    *   `lessons_published`: A map of `cuId` -> `currentLessonId`.
    *   `research_runs`: A map of `runId` -> `ResearchOutput` (citations, raw text).
    *   `assets`: A map of `assetId` -> `Asset` (diagrams, code snippets).

## 3. Content Compiler Pipeline

We will implement a "Compiler" that takes a topic and produces a `LessonSpec`.

### Pipeline Stages

1.  **Research Brief:**
    *   **Input:** Topic ("Rust Ownership").
    *   **Output:** `ResearchBrief` (Objectives, Misconceptions, Key Terms, Sources).
    *   **Prompt:** "Act as a curriculum researcher. Identify the top 3 misconceptions about [TOPIC] and the 5 key concepts required to master it."

2.  **Lesson Skeleton:**
    *   **Input:** `ResearchBrief`.
    *   **Output:** `LessonSkeleton` (PDCA outline, block types).
    *   **Prompt:** "Structure a PDCA lesson for [TOPIC]. Plan: Predict [X]. Do: Solve [Y]. Check: Verify [Z]. Act: Reflect on [W]."

3.  **Block Authoring:**
    *   **Input:** `LessonSkeleton`.
    *   **Output:** Full `LessonSpec` with text, exercises, and hints.
    *   **Prompt:** "Write the 'Plan' stage content. Include an explainer block about [CONCEPT] and a prediction prompt asking [QUESTION]."

4.  **Assessment Authoring:**
    *   **Input:** `LessonSpec` (draft).
    *   **Output:** Added `Rubric` and `TransferTask`.
    *   **Prompt:** "Create a transfer task that tests if the learner can apply [CONCEPT] to a completely different context."

5.  **Validation:**
    *   **Input:** `LessonSpec`.
    *   **Output:** Validation Report (Pass/Fail).
    *   **Logic:** Check Zod schema, ensure every objective has an exercise, ensure citations are present.

## 4. Perplexity Integration (ResearchProvider)

We will abstract the research source behind an interface.

```typescript
interface ResearchProvider {
  search(query: string): Promise<ResearchResult[]>;
  getSourceDetails(sourceId: string): Promise<SourceDetails>;
}
```

*   **Mock Mode:** Returns hardcoded or LLM-hallucinated (but structured) research data.
*   **Real Mode:** Calls Perplexity API.
*   **Constraint:** The UI *never* calls this provider. Only the Content Compiler calls it during the "Research Brief" stage.

## 5. Ingestion Console (Settings)

The `app/settings` page should evolve into the "Teacher's Desk":

1.  **Input:** "Generate Lesson for [Topic]".
2.  **Process:** Runs the Compiler Pipeline (visualized as a progress bar).
3.  **Review:** Shows the generated `LessonSpec` in a preview mode.
4.  **Publish:** Saves to `lessons_published`.
5.  **Run:** Deep links to `app/learn` with the new lesson.
