import { ai } from "../lib/data/genkit";

// Export the flows so the CLI runtime can pick them up when this file is executed.
export * from "../lib/data/genkit";

// Start the flow server so the process stays alive
setInterval(() => {}, 1000 * 60 * 60);

console.log("Genkit Dev Server Running...");


