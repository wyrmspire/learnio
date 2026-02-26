import { SearchProvider, SearchResult } from "../contracts/search";
import { lessonStore } from "../data/lesson-store";
import { LessonVersion } from "../contracts/compiler";

export class LocalIndexSearchProvider implements SearchProvider {
    async search(query: string, limit: number = 5): Promise<SearchResult[]> {
        if (!query || query.trim() === "") {
            return [];
        }

        const normalizedQuery = query.toLowerCase().trim();
        const publishedLessons = lessonStore.getAllPublishedLessons();
        const results: SearchResult[] = [];

        for (const version of publishedLessons) {
            const spec = version.spec;
            let score = 0;
            let snippet = "";

            // Scoring logic
            const titleMatch = spec.title.toLowerCase().includes(normalizedQuery);
            if (titleMatch) score += 10;

            const topicMatch = spec.topic.toLowerCase().includes(normalizedQuery);
            if (topicMatch) score += 5;

            const descMatch = spec.description.toLowerCase().includes(normalizedQuery);
            if (descMatch) score += 3;

            // Search within blocks
            const allBlocks = [
                ...(spec.stages.plan.blocks ?? []),
                ...(spec.stages.do.blocks ?? []),
                ...(spec.stages.check.blocks ?? []),
                ...(spec.stages.act.blocks ?? []),
            ];

            let blockMatch = false;
            for (const block of allBlocks) {
                // Not all blocks have text, but most do
                const blockText = (block as any).text ?? (block as any).html ?? "";
                if (typeof blockText === "string" && blockText.toLowerCase().includes(normalizedQuery)) {
                    score += 1;
                    if (!snippet) {
                        snippet = this.createSnippet(blockText, normalizedQuery);
                    }
                    blockMatch = true;
                }
            }

            if (score > 0) {
                // If we didn't extract a snippet from blocks, use description
                if (!snippet) {
                    snippet = this.createSnippet(spec.description, normalizedQuery);
                }

                results.push({
                    lessonId: spec.id,
                    versionId: version.id,
                    title: spec.title,
                    topic: spec.topic,
                    snippet,
                    score,
                });
            }
        }

        // Sort by score descending and limit
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    private createSnippet(text: string, query: string): string {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);

        if (index === -1) {
            return text.substring(0, 100) + (text.length > 100 ? "..." : "");
        }

        // Return a window around the match
        const start = Math.max(0, index - 40);
        const end = Math.min(text.length, index + lowerQuery.length + 40);

        let snippet = text.substring(start, end);
        if (start > 0) snippet = "..." + snippet;
        if (end < text.length) snippet = snippet + "...";

        return snippet.trim();
    }
}
