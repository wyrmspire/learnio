/**
 * G1 · Event Store Replay & Hydration Test
 *
 * Integration test for:
 * 1. Appending events -> writing to localStorage
 * 2. Deriving a read model
 * 3. Forcing a reload/hydration loop
 * 4. Deriving the target read model again
 * 5. Checking that they match perfectly
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

// 1. Setup global mocks for localStorage before importing eventStore
const mockStorage = new Map<string, string>();
const fakeLocalStorage = {
    getItem: (key: string) => mockStorage.get(key) || null,
    setItem: (key: string, val: string) => mockStorage.set(key, val),
    removeItem: (key: string) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
};

(global as any).window = {};
(global as any).localStorage = fakeLocalStorage;

import { eventStore } from "./store";
import { DomainEvent } from "./types";

const mockEvents: DomainEvent[] = [
    {
        id: "evt-1",
        type: "AttemptSubmitted",
        timestamp: "2024-01-01T10:00:00.000Z",
        userId: "user-1",
        payload: { cuId: "cu-1", stage: "plan", inputs: {} },
    },
    {
        id: "evt-2",
        type: "ConfidenceUpdated",
        timestamp: "2024-01-01T10:05:00.000Z",
        userId: "user-1",
        payload: { cuId: "cu-1", delta: 0.1, reason: "hint_penalty" },
    },
    {
        id: "evt-3",
        type: "CULoopClosed",
        timestamp: "2024-01-01T10:10:00.000Z",
        userId: "user-1",
        payload: { cuId: "cu-1", evidenceGained: true },
    },
];

describe("Event Store Replay & Hydration", () => {
    beforeEach(() => {
        mockStorage.clear();
        eventStore.reset(); // clear in-memory events as well
    });

    afterEach(() => {
        mockStorage.clear();
        eventStore.reset();
    });

    it("rehydrates identically, maintaining read-model projection determinism", () => {
        // 1. Append events (triggers persist to our mockStorage)
        eventStore.appendEvents(mockEvents);

        // 2. Derive read model initially
        const initialProjection = eventStore.deriveProgressFeedReadModel();

        // Verify it's not empty
        expect(initialProjection[0].title).toBe("Completed CU Loop");
        expect(initialProjection[1].title).toBe("Confidence Updated");

        // 3. Force a reload/hydration loop
        // Clear in-memory state but LEAVE localStorage intact
        (eventStore as any).events = [];
        // Re-hydrate from localStorage
        (eventStore as any).hydrate();

        // 4. Derive the target read model again
        const rehydratedProjection = eventStore.deriveProgressFeedReadModel();

        // 5. Assert identical results
        expect(initialProjection).toEqual(rehydratedProjection);
    });
});
