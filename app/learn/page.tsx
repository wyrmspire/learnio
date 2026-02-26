"use client";

import { useReducer, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { useSubmitAttempt, useEmitEvent } from "@/lib/hooks/use-data";
import { mockRustLesson } from "@/lib/data/mock-lessons";
import { LessonBlockRenderer } from "./components/LessonRenderer";
import { lessonStore } from "@/lib/data/lesson-store";
import { LessonSpec } from "@/lib/contracts/lesson";

function LearnSession() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lessonId");
  const versionId = searchParams.get("versionId");

  const [lesson, setLesson] = useState<LessonSpec | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [state, dispatch] = useReducer(pdcaReducer, initialPDCAState);
  const { submit, loading, error } = useSubmitAttempt();
  const { emit } = useEmitEvent();

  useEffect(() => {
    if (!lessonId) {
      // Fallback to mock lesson for dev if no ID provided
      setLesson(mockRustLesson);
      setLoadingLesson(false);
      return;
    }

    try {
      let version;
      if (versionId) {
        version = lessonStore.getVersion(versionId);
      } else {
        version = lessonStore.getPublishedVersion(lessonId);
      }

      if (!version) {
        setLoadError(`Lesson not found: ${lessonId} ${versionId ? `(v: ${versionId})` : ""}`);
      } else {
        setLesson(version.spec);
      }
    } catch (e) {
      setLoadError("Failed to load lesson.");
    } finally {
      setLoadingLesson(false);
    }
  }, [lessonId, versionId]);

  const handleBlockInteract = (blockId: string, interaction: any) => {
    if (!lesson) return;

    // Dispatch to reducer (if needed for local state)
    dispatch({ type: "BLOCK_INTERACTED", payload: { blockId, interaction } });

    // Emit domain event
    emit({
      id: `evt-${Date.now()}`,
      type: "BlockInteracted",
      userId: "user-1",
      timestamp: new Date().toISOString(),
      payload: {
        lessonId: lesson.id,
        blockId,
        interaction
      }
    });
  };

  const handlePlanSubmit = async () => {
    if (!lesson) return;
    dispatch({ type: "COMMIT_PREDICTION" });
    await submit({
      id: `att-${Date.now()}`,
      userId: "user-1",
      skillId: "skill-ai-eng", // TODO(B4): derive from routing context
      lessonId: lesson.id,
      cuId: lesson.cuIds[0],
      stage: "plan",
      inputs: { prediction: state.prediction },
      hintsUsed: 0,
      misconceptionTags: [],
      timestamp: new Date().toISOString()
    });
  };

  const handleDoSubmit = async () => {
    if (!lesson) return;
    dispatch({ type: "SUBMIT_DIAGNOSIS", payload: "Exercise Attempt" });
    await submit({
      id: `att-${Date.now()}`,
      userId: "user-1",
      skillId: "skill-ai-eng", // TODO(B4): derive from routing context
      lessonId: lesson.id,
      cuId: lesson.cuIds[0],
      stage: "do",
      inputs: { diagnosis: "Exercise Attempt" },
      hintsUsed: 0,
      misconceptionTags: [],
      timestamp: new Date().toISOString()
    });
  };

  const handleCheckSubmit = async () => {
    if (!lesson) return;
    dispatch({ type: "COMPLETE_CHECK" });
    await submit({
      id: `att-${Date.now()}`,
      userId: "user-1",
      skillId: "skill-ai-eng", // TODO(B4): derive from routing context
      lessonId: lesson.id,
      cuId: lesson.cuIds[0],
      stage: "check",
      inputs: {},
      hintsUsed: 0,
      misconceptionTags: [],
      timestamp: new Date().toISOString()
    });
  };

  const handleActSubmit = async () => {
    if (!lesson) return;
    dispatch({ type: "CLOSE_LOOP" });

    // Emit Lesson Completed Event
    emit({
      id: `evt-${Date.now()}`,
      type: "LessonCompleted",
      userId: "user-1",
      timestamp: new Date().toISOString(),
      payload: {
        skillId: "skill-ai-eng", // TODO(B4): derive from routing context
        lessonId: lesson.id,
      }
    });

    await submit({
      id: `att-${Date.now()}`,
      userId: "user-1",
      skillId: "skill-ai-eng", // TODO(B4): derive from routing context
      lessonId: lesson.id,
      cuId: lesson.cuIds[0],
      stage: "act",
      inputs: { reflection: state.reflection },
      hintsUsed: 0,
      misconceptionTags: [],
      timestamp: new Date().toISOString()
    });
    alert("Lesson Completed! Evidence gained.");
  };

  if (loadingLesson) return <div className="p-8 text-center">Loading lesson...</div>;
  if (loadError) return <div className="p-8 text-center text-red-500">{loadError}</div>;
  if (!lesson) return null;

  const renderStageContent = () => {
    if (!lesson) return null;
    const stageBlocks = lesson.stages[state.currentStage].blocks;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900 mb-4 capitalize">{state.currentStage} Stage</h2>

          {/* Render Blocks */}
          <div className="space-y-8">
            {stageBlocks.map((block, index) => (
              <LessonBlockRenderer
                key={block.id}
                block={block}
                index={index}
                onInteract={(interaction) => handleBlockInteract(block.id, interaction)}
              />
            ))}
          </div>

          {/* Stage Controls */}
          <div className="mt-8 pt-6 border-t border-stone-100 flex justify-end">
            {state.currentStage === 'plan' && state.stages.plan !== 'completed' && (
              <button
                onClick={handlePlanSubmit}
                disabled={loading} // Prediction block handles its own lock, this is stage lock
                className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Commit & Proceed
              </button>
            )}

            {state.currentStage === 'do' && (
              <button
                onClick={handleDoSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Work
              </button>
            )}

            {state.currentStage === 'check' && (
              <button
                onClick={handleCheckSubmit}
                disabled={loading}
                className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete Check
              </button>
            )}

            {state.currentStage === 'act' && (
              <button
                onClick={handleActSubmit}
                disabled={loading}
                className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Close Lesson Loop
              </button>
            )}
          </div>
        </div>
      </div>
    );
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
            <span>{lesson.topic}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-stone-900 font-medium">{lesson.title}</span>
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

export default function LearnSessionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LearnSession />
    </Suspense>
  );
}
