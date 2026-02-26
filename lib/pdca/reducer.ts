import { PDCAState, PDCAAction } from "./types";

export const initialPDCAState: PDCAState = {
  currentStage: "plan",
  stages: {
    plan: "active",
    do: "locked",
    check: "locked",
    act: "locked",
  },
  prediction: "",
  diagnosis: "",
  reflection: "",
};

// Pure function reducer for PDCA state machine
export function pdcaReducer(state: PDCAState, action: PDCAAction): PDCAState {
  switch (action.type) {
    case "UPDATE_PREDICTION":
      return { ...state, prediction: action.payload };

    case "COMMIT_PREDICTION":
      // Guard: Prediction must not be empty
      if (!state.prediction.trim()) return state;
      return {
        ...state,
        currentStage: "do",
        stages: {
          ...state.stages,
          plan: "completed",
          do: "active",
        },
      };

    case "SUBMIT_DIAGNOSIS":
      // Guard: Cannot submit if 'do' is not active
      if (state.stages.do !== "active") return state;
      return {
        ...state,
        diagnosis: action.payload,
        currentStage: "check",
        stages: {
          ...state.stages,
          do: "completed",
          check: "active",
        },
      };

    case "COMPLETE_CHECK":
      if (state.stages.check !== "active") return state;
      return {
        ...state,
        currentStage: "act",
        stages: {
          ...state.stages,
          check: "completed",
          act: "active",
        },
      };

    case "UPDATE_REFLECTION":
      return { ...state, reflection: action.payload };

    case "CLOSE_LOOP":
      if (state.stages.act !== "active") return state;
      return {
        ...state,
        stages: {
          ...state.stages,
          act: "completed",
        },
      };

    case "JUMP_TO_STAGE":
      // Guard: Can only jump to unlocked or completed stages
      if (state.stages[action.payload] === "locked") return state;
      return {
        ...state,
        currentStage: action.payload,
      };

    // New Events: These don't change the PDCA state machine directly,
    // but are allowed to flow through for side effects (logging/analytics)
    case "BLOCK_INTERACTED":
    case "HINT_REVEALED":
    case "LESSON_COMPLETED":
      return state;

    default:
      return state;
  }
}
