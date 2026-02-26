/**
 * STAGED CONTENT COMPILER
 *
 * An async-generator wrapper around the ContentCompiler interface that yields
 * an immutable `CompilerRun` snapshot at each of the 5 pipeline phases:
 *
 *   brief → skeleton → blocks → validate → package
 *
 * This allows callers (UI, tests, logging) to inspect intermediate state
 * without coupling to the underlying implementation.
 *
 * Usage:
 *   for await (const run of stagedCompiler.compile("Rust ownership")) {
 *     console.log(run.phase, run.status, run.artifacts);
 *   }
 */

import {
    CompilerRun,
    CompilerRunSchema,
    LessonVersion,
    ResearchBrief,
    LessonSkeleton,
} from "../contracts/compiler";
import { ContentCompiler } from "../contracts/compiler";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StagedCompilerOptions {
    /** The underlying ContentCompiler to delegate each phase to. */
    compiler: ContentCompiler;
    /** Model/version metadata baked into the CompilerRun provenance. */
    model?: string;
    promptBundleVersion?: string;
    /**
     * Optional callback invoked with the final completed CompilerRun.
     * Use this to persist the run to a store (e.g. lessonStore.saveRun).
     * Omitting it is useful in tests and non-browser environments.
     */
    onRunSaved?: (run: CompilerRun) => void;
}

// ---------------------------------------------------------------------------
// Helper: build a validated snapshot
// ---------------------------------------------------------------------------

function snapshot(
    base: Omit<CompilerRun, "artifacts"> & { artifacts: CompilerRun["artifacts"] }
): CompilerRun {
    return CompilerRunSchema.parse(base);
}

// ---------------------------------------------------------------------------
// StagedContentCompiler
// ---------------------------------------------------------------------------

export class StagedContentCompiler {
    private readonly compiler: ContentCompiler;
    private readonly model: string;
    private readonly promptBundleVersion: string;
    private readonly onRunSaved?: (run: CompilerRun) => void;

    constructor(options: StagedCompilerOptions) {
        this.compiler = options.compiler;
        this.model = options.model ?? "mock-llm-v1";
        this.promptBundleVersion = options.promptBundleVersion ?? "v1.0.0";
        this.onRunSaved = options.onRunSaved;
    }

    /**
     * Compile content for `topic` through the 5 pipeline phases.
     * Yields a validated `CompilerRun` snapshot after EACH phase completes.
     * On failure the final yielded value has `status: "failed"`.
     *
     * The generator also saves the final CompilerRun into `lessonStore` so
     * the app layer can look it up by `run.id`.
     */
    async *compile(topic: string): AsyncGenerator<CompilerRun, CompilerRun, undefined> {
        const runId = `run-${Date.now()}`;
        const timestamp = new Date().toISOString();
        const provenance = { model: this.model, promptBundleVersion: this.promptBundleVersion };

        // Seed: pending state (no phase yet)
        let run: CompilerRun = snapshot({
            id: runId,
            timestamp,
            topic,
            phase: undefined,
            status: "pending",
            artifacts: {},
            provenance,
        });

        // ---- Phase 1: brief -----------------------------------------------
        run = snapshot({ ...run, phase: "brief", status: "running" });
        yield run;

        let brief: ResearchBrief;
        try {
            brief = await this.compiler.generateResearchBrief(topic);
            run = snapshot({ ...run, artifacts: { ...run.artifacts, brief } });
            yield run;
        } catch (err) {
            yield snapshot({ ...run, status: "failed" });
            return snapshot({ ...run, status: "failed" });
        }

        // ---- Phase 2: skeleton ---------------------------------------------
        run = snapshot({ ...run, phase: "skeleton", status: "running" });
        yield run;

        let skeleton: LessonSkeleton;
        try {
            skeleton = await this.compiler.generateSkeleton(brief);
            run = snapshot({ ...run, artifacts: { ...run.artifacts, skeleton } });
            yield run;
        } catch (err) {
            yield snapshot({ ...run, status: "failed" });
            return snapshot({ ...run, status: "failed" });
        }

        // ---- Phase 3: blocks -----------------------------------------------
        run = snapshot({ ...run, phase: "blocks", status: "running" });
        yield run;

        let draftLesson: CompilerRun["artifacts"]["draftLesson"];
        try {
            draftLesson = await this.compiler.authorBlocks(skeleton, brief);
            run = snapshot({ ...run, artifacts: { ...run.artifacts, draftLesson } });
            yield run;
        } catch (err) {
            yield snapshot({ ...run, status: "failed" });
            return snapshot({ ...run, status: "failed" });
        }

        if (!draftLesson) {
            // Type guard — should not happen but keeps TypeScript happy.
            yield snapshot({ ...run, status: "failed" });
            return snapshot({ ...run, status: "failed" });
        }

        // ---- Phase 4: validate ---------------------------------------------
        run = snapshot({ ...run, phase: "validate", status: "running" });
        yield run;

        let validation: CompilerRun["artifacts"]["validation"];
        try {
            validation = await this.compiler.validateLesson(draftLesson);
            run = snapshot({ ...run, artifacts: { ...run.artifacts, validation } });
            yield run;
        } catch (err) {
            yield snapshot({ ...run, status: "failed" });
            return snapshot({ ...run, status: "failed" });
        }

        // ---- Phase 5: package ----------------------------------------------
        run = snapshot({ ...run, phase: "package", status: "running" });
        yield run;

        let lessonVersion: LessonVersion;
        try {
            lessonVersion = await this.compiler.packageLessonVersion(draftLesson, runId);
            // Mark completed
            run = snapshot({ ...run, status: "completed" });
        } catch (err) {
            yield snapshot({ ...run, status: "failed" });
            return snapshot({ ...run, status: "failed" });
        }

        // Persist the completed run record (if a store callback was provided)
        this.onRunSaved?.(run);

        yield run;
        return run;
    }

    /**
     * Convenience: run the full pipeline and collect all intermediate snapshots.
     * Returns `{ snapshots, finalRun, lessonVersion }`.
     * Snapshots includes every yielded state (useful for UI progress bars and tests).
     */
    async runFull(topic: string): Promise<{ snapshots: CompilerRun[]; finalRun: CompilerRun }> {
        const snapshots: CompilerRun[] = [];
        let finalRun!: CompilerRun;

        const gen = this.compile(topic);
        let result = await gen.next();

        while (!result.done) {
            snapshots.push(result.value);
            result = await gen.next();
        }

        // The generator's return value is the final run (could be success or failure)
        finalRun = result.value ?? snapshots[snapshots.length - 1];

        return { snapshots, finalRun };
    }
}
