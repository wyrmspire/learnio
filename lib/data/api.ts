import { DataClient } from "./client";
import { Capability, CapabilityUnit, ProgressEvent, Attempt, Session, Recommendation } from "../contracts/schemas";

// API Client that fetches from Next.js Route Handlers
export class ApiDataClient implements DataClient {
  async listCapabilities(): Promise<Capability[]> {
    const res = await fetch("/api/capabilities");
    return res.json();
  }

  async getCapability(id: string): Promise<Capability | null> {
    const res = await fetch(`/api/capabilities/${id}`);
    return res.json();
  }

  async getCU(id: string): Promise<CapabilityUnit | null> {
    const res = await fetch(`/api/cus/${id}`);
    return res.json();
  }

  async listProgressEvents(): Promise<ProgressEvent[]> {
    const res = await fetch("/api/progress");
    return res.json();
  }

  async submitAttempt(attempt: Attempt): Promise<void> {
    await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attempt),
    });
  }

  async getRecommendations(): Promise<Recommendation[]> {
    const res = await fetch("/api/recommendations");
    return res.json();
  }

  async createSession(cuId: string): Promise<Session> {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuId }),
    });
    return res.json();
  }
}
