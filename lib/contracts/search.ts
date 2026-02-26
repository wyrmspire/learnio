import { z } from "zod";

export const SearchResultSchema = z.object({
    lessonId: z.string(),
    versionId: z.string(),
    title: z.string(),
    topic: z.string(),
    snippet: z.string(),
    score: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export interface SearchProvider {
    /**
     * Searches the provider's index for the given query.
     * @param query Search string
     * @param limit Maximum number of results to return
     */
    search(query: string, limit?: number): Promise<SearchResult[]>;
}
