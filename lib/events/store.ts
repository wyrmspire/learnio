import { DomainEvent } from "./types";
import { mockCapabilities, mockProgressEvents } from "../mock-data";
import { Capability, ProgressEvent } from "../contracts/schemas";

/**
 * EVENT STORE
 *
 * This is the source of truth for all dynamic state.
 * Do not store derived state elsewhere.
 * Do not mutate read models directly.
 * Replayability is a hard requirement.
 */
class EventStore {
  private events: DomainEvent[] = [];
  private readonly STORAGE_KEY = "capability_sandbox_events";

  constructor() {
    this.hydrate();
  }

  private hydrate() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to hydrate events", e);
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
    } catch (e) {
      console.error("Failed to persist events", e);
    }
  }

  appendEvent(event: DomainEvent) {
    this.events.push(event);
    this.persist();
    console.log(`[EventStore] Appended: ${event.type}`, event);
  }

  appendEvents(events: DomainEvent[]) {
    this.events.push(...events);
    this.persist();
    events.forEach(e => console.log(`[EventStore] Appended: ${e.type}`, e));
  }

  listEvents(filter?: (e: DomainEvent) => boolean) {
    return filter ? this.events.filter(filter) : this.events;
  }

  reset() {
    this.events = [];
    this.persist();
  }

  // Derive Dashboard Read Model (Capabilities)
  deriveDashboardReadModel(): Capability[] {
    let capabilities = [...mockCapabilities] as Capability[];

    this.events.forEach(event => {
      if (event.type === "ConfidenceUpdated" && 'delta' in event.payload) {
        capabilities = capabilities.map(cap => {
          if (cap.id === "cap-1") { // Simplified mapping
            return {
              ...cap,
              confidence: Math.min(1, Math.max(0, cap.confidence + (event.payload.delta as number))),
              lastEvidenceAt: event.timestamp,
            };
          }
          return cap;
        });
      }
    });

    return capabilities;
  }

  // Derive Progress Feed Read Model
  deriveProgressFeedReadModel(): ProgressEvent[] {
    let feed = [...mockProgressEvents] as ProgressEvent[];

    const derivedEvents = this.events
      .filter(e => e.type === "AttemptSubmitted" || e.type === "CULoopClosed" || e.type === "ConfidenceUpdated")
      .reverse() // Newest first
      .map((e, idx) => {
        let title = "";
        let details = "";
        let chips: string[] = [];

        if (e.type === "CULoopClosed") {
          title = `Completed CU Loop`;
          details = "Successfully completed a full Plan-Do-Check-Act cycle.";
          chips = ["Evidence Gained", "PDCA Closed"];
        } else if (e.type === "AttemptSubmitted") {
          title = `Attempted Stage: ${(e.payload as any).stage}`;
          details = "Submitted work for evaluation.";
          chips = ["In Progress"];
        } else if (e.type === "ConfidenceUpdated") {
          const payload = e.payload as any;
          title = `Confidence Updated`;
          details = `Confidence adjusted by ${payload.delta > 0 ? '+' : ''}${Math.round(payload.delta * 100)}%. Reason: ${payload.reason}`;
          chips = ["Confidence", payload.delta > 0 ? "Increased" : "Decreased"];
        }

        return {
          id: `derived-${e.id}`,
          title,
          timestamp: new Date(e.timestamp).toLocaleTimeString(),
          chips,
          details,
        };
      });

    return [...derivedEvents, ...feed];
  }
}

export const eventStore = new EventStore();
