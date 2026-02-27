import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

// Initialize Genkit
export const ai = genkit({
    plugins: [googleAI()],
    // We can default this to gemini 2.5 flash for fast tasks, but flows can override it
    model: "googleai/gemini-2.5-flash",
});

// A test flow to ensure Genkit is wired up correctly.
export const helloFlow = ai.defineFlow(
    {
        name: "helloFlow",
        inputSchema: z.string().describe("The user's name"),
        outputSchema: z.string().describe("A greeting message"),
    },
    async (name) => {
        const response = await ai.generate(`Say a cool, AI-themed hello to ${name}`);
        return response.text;
    }
);
