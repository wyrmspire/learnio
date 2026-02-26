import { CurriculumBuildRequest, CapabilityMapEntry, CurriculumBuilder } from "../contracts/curriculum";

/**
 * CurriculumBuilderStub
 *
 * Stub implementation of `CurriculumBuilder`.
 * Yields placeholder `CapabilityMapEntry` items based on `seedTopics` or
 * a simple derived topic list from the domain string.
 *
 * This stub exists to:
 * 1. Satisfy the `CurriculumBuilder` interface contract (D3 task).
 * 2. Enable downstream consumers (UI, orchestrators) to be written against
 *    the interface before the real StagedContentCompiler (D1) is complete.
 *
 * TODO(D1+D3): Replace the stub body with real calls to `StagedContentCompiler.run(topic)`
 * once D1 is finished. The interface will remain the same.
 */
export class CurriculumBuilderStub implements CurriculumBuilder {
    /**
     * Derive a list of topics to generate.
     * Uses seedTopics if provided; otherwise creates N placeholder topics.
     */
    private deriveTopics(request: CurriculumBuildRequest): string[] {
        if (request.seedTopics && request.seedTopics.length > 0) {
            return request.seedTopics.slice(0, request.maxTopics);
        }
        // Generate placeholder topic names from the domain
        const count = request.maxTopics;
        return Array.from({ length: count }, (_, i) => `${request.domain} — Topic ${i + 1}`);
    }

    /**
     * Slugify a topic string into a stable lesson ID.
     */
    private topicToLessonId(topic: string): string {
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return `lesson-${slug}`;
    }

    async *build(request: CurriculumBuildRequest): AsyncGenerator<CapabilityMapEntry, void, unknown> {
        const topics = this.deriveTopics(request);

        for (let index = 0; index < topics.length; index++) {
            const topic = topics[index];
            const lessonId = this.topicToLessonId(topic);
            const compilerRunId = `stub-run-${Date.now()}-${index}`;

            const entry: CapabilityMapEntry = {
                topic,
                lessonId,
                compilerRunId,
                sequenceIndex: index,
                published: false,
            };

            // Simulate async pipeline delay (stub only)
            await new Promise<void>((resolve) => setTimeout(resolve, 100));

            yield entry;
        }
    }
}
