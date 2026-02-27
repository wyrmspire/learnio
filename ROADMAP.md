# Roadmap: LearnIO Engine

This roadmap outlines the evolution of LearnIO from a mock-first sandbox to a production-grade, topic-agnostic learning engine.

## Phase 0: Engine Spine (✅ Completed)
**Goal:** Establish the deterministic core and event-sourced architecture.
- [x] **Event Store:** In-memory store with localStorage persistence.
- [x] **Command Pattern:** Pure function commands (`submitAttemptCommand`) producing domain events.
- [x] **Read Models:** Deterministic derivation of Dashboard and Progress Feed from event log.
- [x] **PDCA Runner:** State machine reducer for Plan-Do-Check-Act workflow.
- [x] **Data Abstraction:** `DataClient` interface with Mock/API modes.
- [x] **AI Guardrails:** `AI_WORKING_GUIDE.md` and strict architectural invariants.

## Phase 1: Content Factory & Lesson Spec (📍 Next Up)
**Goal:** Transform the app from a hardcoded runner to a dynamic renderer of structured lessons.
- [ ] **Lesson Spec Schema:** Define the Zod schema for `LessonSpec` (blocks, interactions, rubrics).
- [ ] **Content Compiler (Mock):** Implement a pipeline to generate `LessonSpec` JSON from a topic prompt (using local LLM or heuristics).
- [ ] **Lesson Storage (Mock):** Implement a lightweight local store (e.g., JSON/SQLite) for `lesson_versions` and `lessons_published`.
- [ ] **Ingestion Console:** Update `app/settings` to allow generating, validating, and publishing lessons.
- [ ] **Dynamic Runner:** Update `app/learn` to render `LessonSpec` blocks instead of hardcoded JSX.

**Definition of Done:**
- I can go to Settings, type "Rust Ownership", click "Generate", and see a new structured lesson appear.
- I can click "Play" and run through that specific lesson in the Learn runner.
- All interactions emit standard events (`AttemptSubmitted`, `ConfidenceUpdated`).

**Risks:**
- Over-complicating the `LessonSpec` early. Keep it to text, code, and multiple-choice first.
- "Hallucinated" lesson structure breaking the renderer. Strict validation is required.

## Phase 2: Interactive Teacher Polish
**Goal:** Make the runner feel like a responsive coach, not just a form wizard.
- [ ] **Coach Panel:** A side panel that offers help *constrained* to the current lesson block and user telemetry.
- [ ] **Adaptive Scaffolding:** "Hint Ladder" that unlocks progressively based on failed attempts.
- [ ] **Remediation Blocks:** Dynamic insertion of review blocks if a user fails a Check stage.
- [ ] **Rich Assets:** Support for diagrams (Mermaid/SVG) and code playgrounds in lesson blocks.
- [ ] **Practice Queue:** A "Spaced Repetition" view powered by stored items and confidence decay.

**Definition of Done:**
- The system "notices" when I struggle and offers a specific hint.
- If I fail a concept, it schedules a review item for tomorrow.

## Phase 3: AI Orchestration (Genkit + Real Models)
**Goal:** Replace mock/LLM generation with grounded, cited research and functional Genkit orchestration.
- [ ] **Genkit Pipeline Integration:** Rebuild the `StagedContentCompiler` using Firebase Genkit flows for observability and strict typing.
- [ ] **ResearchProvider Interface:** Abstract the source of truth, implemented as a Genkit tool/action.
- [ ] **Perplexity Adapter:** Implement the provider using Perplexity API (orchestrated via Genkit).
- [ ] **Citation Pipeline:** Ensure every generated block carries source IDs from the research phase.
- [ ] **Source Audit UI:** Allow users to click a citation and see the source context.

**Definition of Done:**
- Genkit successfully runs local or cloud-based UI for flow traces.
- Lessons generated include real-world, verifiable citations via real LLM API calls.
- The "Research Brief" phase produces a high-quality, sourced outline orchestrated entirely via a Genkit flow.

## Phase 4: Production Hardening
**Goal:** Move from sandbox to scalable SaaS.
- [ ] **Server-Side Commands:** Move `lib/commands` logic to a secure backend API.
- [ ] **DB Event Store:** Replace `localStorage` with Postgres/EventStoreDB.
- [ ] **Auth & Tenancy:** Add `orgId` and `userId` to all events and storage.
- [ ] **Async Projections:** Move read model derivation to background workers.

**Definition of Done:**
- The app works for multiple users on different devices.
- State is persisted reliably in a database.
