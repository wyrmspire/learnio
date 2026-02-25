import { DataClient } from "./client";
import { Capability, CapabilityUnit, ProgressEvent, Attempt, Session, Recommendation } from "../contracts/schemas";
import { eventStore } from "../events/store";
import { mockCapabilities, mockProgressEvents } from "../mock-data";
import { submitAttemptCommand } from "../commands";

export class MockDataClient implements DataClient {
  async listCapabilities(): Promise<Capability[]> {
    return eventStore.deriveDashboardReadModel();
  }

  async getCapability(id: string): Promise<Capability | null> {
    const caps = eventStore.deriveDashboardReadModel();
    return caps.find(c => c.id === id) || null;
  }

  async getCU(id: string): Promise<CapabilityUnit | null> {
    return { id, capabilityId: "cap-1", title: "Diagnose Bottlenecks", status: "unlocked" };
  }

  async listProgressEvents(): Promise<ProgressEvent[]> {
    return eventStore.deriveProgressFeedReadModel();
  }

  async submitAttempt(attempt: Attempt): Promise<void> {
    // Use the command to generate events deterministically
    const events = submitAttemptCommand(attempt);
    eventStore.appendEvents(events);
  }

  async getRecommendations(): Promise<Recommendation[]> {
    return [{ cuId: "cu-3", reason: "Weakest sub-skill detected", type: "review" }];
  }

  async createSession(cuId: string): Promise<Session> {
    return { id: `sess-${Date.now()}`, userId: "user-1", cuId, currentStage: "plan", startedAt: new Date().toISOString() };
  }
}
