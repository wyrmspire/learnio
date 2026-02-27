"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  Save,
  RefreshCw,
  Search,
  Database,
  ArrowRight,
  History,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LessonSpec } from "@/lib/contracts/lesson";
import { skillLoader } from "@/lib/skills/loader";
import { MockContentCompiler } from "@/lib/data/mock-compiler";
import { CompilerRun, LessonVersion } from "@/lib/contracts/compiler";
import { lessonStore } from "@/lib/data/lesson-store";

const compiler = new MockContentCompiler();

export default function SettingsPage() {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "review" | "published">("idle");
  const [currentRun, setCurrentRun] = useState<CompilerRun | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRuns, setHistoryRuns] = useState<CompilerRun[]>([]);
  const [publishedLessons, setPublishedLessons] = useState<LessonVersion[]>([]);

  // Load history and published lessons on mount
  useEffect(() => {
    setHistoryRuns(lessonStore.getRuns());
    setPublishedLessons(lessonStore.getAllPublishedLessons());
  }, []);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleInstallSkill = async () => {
    addLog("Installing seed skill bundles...");
    try {
      const registry = await skillLoader.loadRegistry();
      for (const entry of registry.skills) {
        addLog(`Installing '${entry.id}'...`);
        await skillLoader.installSkill(entry.id);
      }
      setPublishedLessons(lessonStore.getAllPublishedLessons());
      addLog("All seed skills installed successfully! Lessons available in runner.");
    } catch (e) {
      addLog(`Error installing skills: ${(e as Error).message}`);
    }
  };

  const updateRun = (run: CompilerRun) => {
    setCurrentRun(run);
    lessonStore.saveRun(run); // Persist every step
    setHistoryRuns(lessonStore.getRuns()); // Update history list
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setStatus("generating");
    setLogs([]);
    const runId = `run-${Date.now()}`;

    // Initialize Run Artifact
    const run: CompilerRun = {
      id: runId,
      timestamp: new Date().toISOString(),
      topic,
      status: "pending",
      artifacts: {},
      provenance: { model: "mock-llm-v1", promptBundleVersion: "v1.0.0" }
    };
    updateRun(run);
    addLog(`Starting Compiler Run: ${runId}`);

    try {
      // Step 1: Research Brief
      addLog("Step 1: Generating Research Brief...");
      const brief = await compiler.generateResearchBrief(topic);
      run.artifacts.brief = brief;
      updateRun({ ...run });
      addLog(`Brief generated. Found ${brief.sources.length} sources.`);

      // Step 2: Skeleton
      addLog("Step 2: Designing Lesson Skeleton...");
      const skeleton = await compiler.generateSkeleton(brief);
      run.artifacts.skeleton = skeleton;
      updateRun({ ...run });
      addLog("Skeleton designed. PDCA structure defined.");

      // Step 3: Author Blocks
      addLog("Step 3: Authoring Content Blocks...");
      const draftLesson = await compiler.authorBlocks(skeleton, brief);
      run.artifacts.draftLesson = draftLesson;
      updateRun({ ...run });
      addLog("Draft lesson authored.");

      // Step 4: Validate
      addLog("Step 4: Validating Lesson...");
      const validation = await compiler.validateLesson(draftLesson);
      run.artifacts.validation = validation;

      if (!validation.isValid) {
        run.status = "failed";
        updateRun({ ...run });
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      if (validation.warnings.length > 0) {
        addLog(`Warning: ${validation.warnings.join(", ")}`);
      }

      run.status = "completed"; // Mark as completed (ready for review/publish)
      updateRun({ ...run });

      addLog("Validation Passed. Ready for review.");
      setStatus("review");

    } catch (e) {
      addLog(`Error: ${(e as Error).message}`);
      if (currentRun) {
        const failedRun = { ...currentRun, status: "failed" as const };
        updateRun(failedRun);
      }
      setStatus("idle");
    }
  };

  const handlePublish = async () => {
    if (!currentRun?.artifacts.draftLesson) return;

    addLog("Packaging lesson version...");
    const version = await compiler.packageLessonVersion(currentRun.artifacts.draftLesson, currentRun.id);

    addLog(`Lesson Published! Version ID: ${version.id}`);
    setStatus("published");
    setPublishedLessons(lessonStore.getAllPublishedLessons());
  };

  const loadRunFromHistory = (run: CompilerRun) => {
    setCurrentRun(run);
    setTopic(run.topic);
    setLogs([`[System] Loaded run ${run.id} from history.`]);

    if (run.status === "completed") {
      setStatus("review");
    } else if (run.status === "failed") {
      setStatus("idle");
    } else {
      setStatus("idle");
    }
    setShowHistory(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Ingestion Console</h1>
          <p className="text-stone-500 text-sm">Generate, validate, and publish new lessons.</p>
        </div>
        <div className="flex gap-2 relative">
          <button
            onClick={handleInstallSkill}
            className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span className="text-xs font-medium">Install Seed Skills</span>
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "text-stone-500 hover:text-stone-900 p-2 rounded-lg border border-stone-200 hover:bg-stone-50 flex items-center gap-2",
              showHistory && "bg-stone-100 text-stone-900 ring-2 ring-stone-200"
            )}
          >
            <History className="w-4 h-4" />
            <span className="text-xs font-medium">History</span>
          </button>

          {/* History Dropdown */}
          {showHistory && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
              <div className="p-3 border-b border-stone-100 bg-stone-50 text-xs font-bold text-stone-500 uppercase tracking-wider">
                Recent Runs
              </div>
              <div className="max-h-64 overflow-y-auto">
                {historyRuns.length === 0 ? (
                  <div className="p-4 text-center text-stone-400 text-xs">No runs recorded yet.</div>
                ) : (
                  historyRuns.map(run => (
                    <button
                      key={run.id}
                      onClick={() => loadRunFromHistory(run)}
                      className="w-full text-left p-3 hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-stone-900 truncate max-w-[180px]">{run.topic}</span>
                        <StatusBadge status={run.status} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-400">
                        <span className="font-mono">{run.id.slice(-6)}</span>
                        <span>{new Date(run.timestamp).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Controls & Logs (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Published Lessons List */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Published Lessons
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {publishedLessons.length === 0 ? (
                <div className="text-xs text-stone-400 text-center py-4">No published lessons.</div>
              ) : (
                publishedLessons.map(v => (
                  <div key={v.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between group">
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-stone-900 truncate">{v.spec.title}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{v.id}</div>
                    </div>
                    <a
                      href={`/learn?lessonId=${v.lessonId}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white p-1.5 rounded-md hover:bg-stone-700"
                      title="Run Lesson"
                    >
                      <Play className="w-3 h-3" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              Content Factory
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. React useEffect"
                  className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-stone-900 outline-none"
                  disabled={status === "generating"}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || status === "generating"}
                className="w-full bg-stone-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Generate Lesson
              </button>
            </div>
          </div>

          {/* Pipeline Visualization */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Pipeline Status</div>

            <PipelineStep
              label="Research Brief"
              status={!currentRun ? 'waiting' : currentRun.artifacts.brief ? 'done' : 'active'}
            />
            <PipelineStep
              label="Lesson Skeleton"
              status={!currentRun?.artifacts.brief ? 'waiting' : currentRun.artifacts.skeleton ? 'done' : 'active'}
            />
            <PipelineStep
              label="Block Authoring"
              status={!currentRun?.artifacts.skeleton ? 'waiting' : currentRun.artifacts.draftLesson ? 'done' : 'active'}
            />
            <PipelineStep
              label="Validation"
              status={!currentRun?.artifacts.draftLesson ? 'waiting' : currentRun.artifacts.validation ? 'done' : 'active'}
            />
          </div>

          {/* Logs Console */}
          <div className="bg-stone-900 rounded-xl p-4 text-xs font-mono text-stone-400 h-48 overflow-y-auto border border-stone-800">
            <div className="text-stone-500 mb-2 uppercase tracking-wider font-bold">System Logs</div>
            {logs.length === 0 && <span className="opacity-50">Waiting for jobs...</span>}
            {logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))}
            {status === "generating" && (
              <div className="animate-pulse">_</div>
            )}
          </div>
        </div>

        {/* Right: Artifact Preview (8 cols) */}
        <div className="lg:col-span-8">
          {status === "idle" || status === "generating" ? (
            <div className="h-full min-h-[400px] border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 bg-stone-50/50">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <p>Generated artifacts will appear here</p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
              <div className="border-b border-stone-100 bg-stone-50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-500" />
                  <span className="font-medium text-stone-900">Lesson Artifact: {currentRun?.artifacts.draftLesson?.title}</span>
                  {currentRun?.artifacts.validation?.isValid && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Validated
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {status === "review" && (
                    <button
                      onClick={handlePublish}
                      disabled={!currentRun?.artifacts.validation?.isValid}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Publish Version
                    </button>
                  )}
                  {status === "published" && (
                    <button className="bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-default">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Published
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-8 max-h-[800px] overflow-y-auto">
                {/* Research Brief Section */}
                {currentRun?.artifacts.brief && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Research Brief</h3>
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold text-stone-700">Objectives:</span>
                          <ul className="list-disc list-inside text-stone-600 mt-1">
                            {currentRun.artifacts.brief.objectives.map((o, i) => <li key={i}>{o}</li>)}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold text-stone-700">Misconceptions:</span>
                          <ul className="list-disc list-inside text-stone-600 mt-1">
                            {currentRun.artifacts.brief.misconceptions.map((m, i) => <li key={i}>{m}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lesson Preview Section */}
                {currentRun?.artifacts.draftLesson && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Lesson Content Preview</h3>
                    <div className="border border-stone-200 rounded-lg overflow-hidden">
                      <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 text-xs font-mono text-stone-500">
                        ID: {currentRun.artifacts.draftLesson.id} | Version: {currentRun.provenance.promptBundleVersion}
                      </div>
                      <div className="p-4 space-y-4">
                        <h1 className="text-xl font-bold text-stone-900">{currentRun.artifacts.draftLesson.title}</h1>
                        <p className="text-stone-600">{currentRun.artifacts.draftLesson.description}</p>

                        <div className="space-y-2">
                          <div className="font-medium text-stone-800">Plan Stage Blocks:</div>
                          {currentRun.artifacts.draftLesson.stages.plan.blocks.map(b => (
                            <div key={b.id} className="text-sm text-stone-600 bg-stone-50 p-2 rounded border border-stone-100 flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-stone-200 text-stone-600 rounded text-[10px] font-mono uppercase">{b.type}</span>
                              <span className="truncate">{(b as any).markdown || (b as any).prompt || "Content..."}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ label, status }: { label: string, status: 'waiting' | 'active' | 'done' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
        status === 'waiting' ? "bg-stone-100 text-stone-400" :
          status === 'active' ? "bg-blue-100 text-blue-600 animate-pulse" :
            "bg-emerald-100 text-emerald-600"
      )}>
        {status === 'done' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
          status === 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
            <div className="w-2 h-2 rounded-full bg-stone-300" />}
      </div>
      <span className={cn(
        "text-sm font-medium transition-colors",
        status === 'waiting' ? "text-stone-400" : "text-stone-700"
      )}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: CompilerRun['status'] }) {
  if (status === 'completed') return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">DONE</span>;
  if (status === 'failed') return <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">FAIL</span>;
  return <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">RUN</span>;
}
