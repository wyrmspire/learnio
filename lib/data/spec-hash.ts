/**
 * A3 · Lesson Immutability: specHash Utility
 *
 * Provides a pure function to compute a deterministic sha256 hash of a
 * canonicalized LessonSpec. Used by LessonStore.saveVersion() to enforce
 * immutability: same versionId + different specHash → throw.
 *
 * Node-only (uses crypto module). No Date.now(). Pure.
 */

import { createHash } from "crypto";
import { LessonSpec } from "../contracts/lesson";

/**
 * Recursively sorts object keys so that JSON.stringify produces the same
 * string regardless of insertion order. Arrays are NOT re-sorted because
 * block order is semantically meaningful.
 */
function canonicalize(value: unknown): unknown {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(canonicalize);
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
        sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
}

/**
 * Returns the sha256 hex digest of the canonicalized LessonSpec JSON.
 * Deterministic: given the same spec, always returns the same hash.
 */
export function computeSpecHash(spec: LessonSpec): string {
    const canonical = JSON.stringify(canonicalize(spec));
    return createHash("sha256").update(canonical, "utf8").digest("hex");
}
