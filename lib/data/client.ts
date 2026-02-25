import { Capability, CapabilityUnit, ProgressEvent, Attempt, Session, Recommendation } from "../contracts/schemas";

export interface DataClient {
  listCapabilities(): Promise<Capability[]>;
  getCapability(id: string): Promise<Capability | null>;
  getCU(id: string): Promise<CapabilityUnit | null>;
  listProgressEvents(): Promise<ProgressEvent[]>;
  submitAttempt(attempt: Attempt): Promise<void>;
  getRecommendations(): Promise<Recommendation[]>;
  createSession(cuId: string): Promise<Session>;
}
