"use server";

import { helloFlow } from "./genkit";

/**
 * A simple server action to test Genkit flows.
 */
export async function testGenkitHello(name: string) {
    return helloFlow(name);
}
