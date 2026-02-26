import { SearchProvider, SearchResult } from "../contracts/search";
import { lessonStore } from "../data/lesson-store";
import { LessonBlock } from "../contracts/lesson";

export class LocalIndexSearchProvider implements SearchProvider {
    /**
     * Search through all published LessonVersions in the local memory store.
     * Ranks results using a simple term-frequency matching.
     */
    async search(query: string, limit: number = 10): Promise<SearchResult[]> {
        if (!query.trim()) return [];

        // Simple tokenization: lowercase, split by words
        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        const published = lessonStore.getAllPublishedLessons();
        const results: SearchResult[] = [];

        for (const version of published) {
            const spec = version.spec;
            let score = 0;

            const title = spec.title.toLowerCase();
            const topic = spec.topic.toLowerCase();
            const desc = spec.description.toLowerCase();

            // Weight top-level metadata heavily
            for (const token of tokens) {
                if (title.includes(token)) score += 10;
                if (topic.includes(token)) score += 10;
                if (desc.includes(token)) score += 5;
            }

            // Iterate through all blocks across all stages
            const allBlocks: LessonBlock[] = [
                ...spec.stages.plan.blocks,
                ...spec.stages.do.blocks,
                ...spec.stages.check.blocks,
                ...spec.stages.act.blocks,
            ];

            for (const block of allBlocks) {
                // Collect text from various block-specific fields
                const textToSearch = [
                    (block as any).markdown,
                    (block as any).text,
                    (block as any).prompt,
                    (block as any).description,
                    (block as any).question,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                for (const token of tokens) {
                    if (textToSearch.includes(token)) {
                        // Lower weight for block content matches
                        score += 1;
                    }
                }
            }

            if (score > 0) {
                results.push({
                    lessonId: version.lessonId,
                    versionId: version.id,
                    title: spec.title,
                    topic: spec.topic,
                    snippet: spec.description, // Use description as standard snippet for now
                    score,
                });
            }
        }

        // Sort descending by score, take top N
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.max(1, limit));
    }
}
