"use client";

import { useReducer } from "react";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  BookOpen, 
  Lightbulb, 
  FileText, 
  MessageSquare, 
  ChevronRight,
  Play,
  Loader2
} from "lucide-react";
import { pdcaReducer, initialPDCAState } from "@/lib/pdca/reducer";
import { Stage } from "@/lib/pdca/types";
import { useSubmitAttempt } from "@/lib/hooks/use-data";

export default function LearnSessionPage() {
  const [state, dispatch] = useReducer(pdcaReducer, initialPDCAState);
  const { submit, loading, error } = useSubmitAttempt();

  const handlePlanSubmit = async () => {
    dispatch({ type: "COMMIT_PREDICTION" });
    await submit({
      id: `att-${Date.now()}`,
      userId: "user-1",
      cuId: "cu-3",
      stage: "plan",
      inputs: { prediction: state.prediction },
      hintsUsed: 0,
      misconceptionTags: [],
      timestamp: new Date().toISOString()
    });
  };

  const handleDoSubmit = async () => {
    dispatch({ type: "SUBMIT_DIAGNOSIS", payload: "Auth Service" });
    await submit({
      id: `att-${Date.now()}`,
      userId: "user-1",
      cuId: "cu-3",
      stage: "do",
      inputs: { diagnosis: "Auth Service" },
      hintsUsed: 0,
      misconceptionTags: [],
      timestamp: new Date().toISOString()
    });
  };

  const handleCheckSubmit = async () => {
    dispatch({ type: "COMPLETE_CHECK" });
    await submit({
      id: `att-${Date.now()}`,
      userId: "user-1",
      cuId: "cu-3",
      stage: "check",
      inputs: {},
      hintsUsed: 0,
      misconceptionTags: [],
      timestamp: new Date().toISOString()
    });
  };

  const handleActSubmit = async () => {
    dispatch({ type: "CLOSE_LOOP" });
    await submit({
      id: `att-${Date.now()}`,
      userId: "user-1",
      cuId: "cu-3",
      stage: "act",
      inputs: { reflection: state.reflection },
      hintsUsed: 0,
      misconceptionTags: [],
      timestamp: new Date().toISOString()
    });
    alert("CU Completed! Evidence gained.");
  };

  const renderStageContent = () => {
    switch (state.currentStage) {
      case 'plan':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Mental Model: The Bottleneck</h2>
              <p className="text-stone-600 mb-6 leading-relaxed">
                In any system, throughput is determined by the slowest component. Identifying this bottleneck is the first step in optimization.
              </p>
              
              <div className="bg-stone-50 border border-stone-100 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-stone-800 mb-2">Quality Bar Constraints</h3>
                <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
                  <li>Must identify the component with the highest utilization.</li>
                  <li>Must propose a solution that doesn&apos;t just shift the bottleneck.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-stone-900">
                  Prediction Prompt <span className="text-rose-500">*</span>
                </label>
                <p className="text-sm text-stone-500 mb-2">
                  Before seeing the system diagram, what metric would you look at first to find a bottleneck?
                </p>
                <textarea 
                  className="w-full border border-stone-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  rows={4}
                  placeholder="I would look at..."
                  value={state.prediction}
                  onChange={(e) => dispatch({ type: "UPDATE_PREDICTION", payload: e.target.value })}
                  disabled={state.stages.plan === 'completed'}
                />
                {state.stages.plan !== 'completed' && (
                  <button 
                    onClick={handlePlanSubmit}
                    disabled={!state.prediction.trim() || loading}
                    className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Commit Prediction to Unlock
                  </button>
                )}
                {state.stages.plan === 'completed' && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                    Prediction committed. Proceed to Do stage.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'do':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Exercise: Diagnose Broken System</h2>
              <p className="text-stone-600 mb-6">
                Review the following architecture diagram and identify the bottleneck.
              </p>
              
              {/* Mock Workspace */}
              <div className="bg-stone-900 rounded-lg p-8 flex items-center justify-center mb-6 min-h-[300px] border border-stone-800">
                 <div className="text-stone-400 font-mono text-sm flex flex-col items-center gap-4">
                    <div className="w-32 h-16 border-2 border-stone-700 rounded flex items-center justify-center bg-stone-800">API Gateway</div>
                    <div className="w-1 h-8 bg-stone-700"></div>
                    <div className="w-32 h-16 border-2 border-rose-500 rounded flex items-center justify-center bg-rose-950/30 text-rose-400">Auth Service (99% CPU)</div>
                    <div className="w-1 h-8 bg-stone-700"></div>
                    <div className="w-32 h-16 border-2 border-stone-700 rounded flex items-center justify-center bg-stone-800">Database</div>
                 </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleDoSubmit}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Diagnosis
                </button>
              </div>
            </div>
          </div>
        );
      case 'check':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Retrieval & Check</h2>
              <p className="text-stone-600 mb-6">
                Let&apos;s verify your understanding.
              </p>
              
              <div className="space-y-6">
                <div className="p-4 border border-stone-200 rounded-lg">
                  <p className="font-medium text-stone-900 mb-3">1. Explain from memory: Why is CPU utilization alone not always indicative of a bottleneck?</p>
                  <textarea className="w-full border border-stone-300 rounded-lg p-3 text-sm" rows={3} placeholder="Your answer..."></textarea>
                </div>
                
                <button 
                  onClick={handleCheckSubmit}
                  disabled={loading}
                  className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Complete Check
                </button>
              </div>
            </div>
          </div>
        );
      case 'act':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Act & Reflect</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-stone-900 mb-2">What broke?</h3>
                  <textarea 
                    className="w-full border border-stone-300 rounded-lg p-3 text-sm" 
                    rows={2} 
                    placeholder="Reflection..."
                    value={state.reflection}
                    onChange={(e) => dispatch({ type: "UPDATE_REFLECTION", payload: e.target.value })}
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">TODO Generator</h3>
                  <p className="text-sm text-blue-700 mb-4">Pick one variable to change in your real context.</p>
                  <input type="text" className="w-full border border-blue-200 rounded-lg p-2 text-sm mb-2" placeholder="Variable to change..." />
                  <input type="text" className="w-full border border-blue-200 rounded-lg p-2 text-sm" placeholder="Expected observation..." />
                </div>

                <button 
                  onClick={handleActSubmit}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Close PDCA Loop
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left Pane: PDCA Rail */}
      <div className="w-48 shrink-0 flex flex-col gap-2">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 px-2">PDCA Loop</h3>
        {(['plan', 'do', 'check', 'act'] as Stage[]).map((stage) => {
          const status = state.stages[stage];
          const isActive = state.currentStage === stage;
          
          return (
            <button
              key={stage}
              onClick={() => status !== 'locked' && dispatch({ type: "JUMP_TO_STAGE", payload: stage })}
              disabled={status === 'locked'}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all text-left w-full",
                isActive ? "bg-white shadow-sm border border-stone-200 text-stone-900" : 
                status === 'completed' ? "text-stone-600 hover:bg-stone-100" : 
                "text-stone-400 opacity-60 cursor-not-allowed"
              )}
            >
              {status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : status === 'locked' ? (
                <Lock className="w-5 h-5" />
              ) : isActive ? (
                <Play className="w-5 h-5 text-blue-500 fill-blue-500/20" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
              <span className="capitalize">{stage}</span>
            </button>
          );
        })}
      </div>

      {/* Main Pane */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
            <span>Capability Unit 3</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-stone-900 font-medium">Diagnose Bottlenecks</span>
          </div>
          {error && (
            <div className="mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {error.message}
            </div>
          )}
        </div>
        
        {renderStageContent()}
      </div>

      {/* Right Pane: Context Tools */}
      <div className="w-72 shrink-0 space-y-4">
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col h-full max-h-[600px]">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-800">Context Tools</h3>
          </div>
          <div className="p-2 flex-1 overflow-y-auto space-y-1">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors text-left">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Hint Ladder
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors text-left">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Glossary
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors text-left">
              <FileText className="w-4 h-4 text-emerald-500" />
              Citations
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors text-left">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              Scratchpad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
