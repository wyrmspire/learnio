import { describe, it, expect } from "vitest";
import { pdcaReducer, initialPDCAState } from "./reducer";

describe("PDCA Reducer", () => {
  it("should update prediction", () => {
    const state = pdcaReducer(initialPDCAState, { type: "UPDATE_PREDICTION", payload: "test" });
    expect(state.prediction).toBe("test");
  });

  it("should not commit empty prediction", () => {
    const state = pdcaReducer(initialPDCAState, { type: "COMMIT_PREDICTION" });
    expect(state.currentStage).toBe("plan");
    expect(state.stages.plan).toBe("active");
  });

  it("should commit valid prediction and unlock 'do' stage", () => {
    let state = pdcaReducer(initialPDCAState, { type: "UPDATE_PREDICTION", payload: "test" });
    state = pdcaReducer(state, { type: "COMMIT_PREDICTION" });
    
    expect(state.currentStage).toBe("do");
    expect(state.stages.plan).toBe("completed");
    expect(state.stages.do).toBe("active");
  });

  it("should progress through all stages correctly", () => {
    let state = initialPDCAState;
    
    // Plan
    state = pdcaReducer(state, { type: "UPDATE_PREDICTION", payload: "test" });
    state = pdcaReducer(state, { type: "COMMIT_PREDICTION" });
    
    // Do
    state = pdcaReducer(state, { type: "SUBMIT_DIAGNOSIS", payload: "auth" });
    expect(state.currentStage).toBe("check");
    expect(state.stages.do).toBe("completed");
    
    // Check
    state = pdcaReducer(state, { type: "COMPLETE_CHECK" });
    expect(state.currentStage).toBe("act");
    expect(state.stages.check).toBe("completed");
    
    // Act
    state = pdcaReducer(state, { type: "CLOSE_LOOP" });
    expect(state.stages.act).toBe("completed");
  });

  it("should allow jumping to unlocked stages", () => {
    let state = initialPDCAState;
    state = pdcaReducer(state, { type: "UPDATE_PREDICTION", payload: "test" });
    state = pdcaReducer(state, { type: "COMMIT_PREDICTION" }); // unlocks 'do'
    
    // Jump back to plan
    state = pdcaReducer(state, { type: "JUMP_TO_STAGE", payload: "plan" });
    expect(state.currentStage).toBe("plan");
    
    // Jump forward to do
    state = pdcaReducer(state, { type: "JUMP_TO_STAGE", payload: "do" });
    expect(state.currentStage).toBe("do");
  });

  it("should prevent jumping to locked stages", () => {
    const state = pdcaReducer(initialPDCAState, { type: "JUMP_TO_STAGE", payload: "check" });
    expect(state.currentStage).toBe("plan"); // unchanged
  });
});
