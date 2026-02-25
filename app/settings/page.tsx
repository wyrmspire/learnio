"use client";

import { useState } from "react";
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Play, 
  Save, 
  RefreshCw,
  Search,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LessonSpec } from "@/lib/contracts/lesson";
import { mockRustLesson } from "@/lib/data/mock-lessons";

// Mock "Compiler" function
const compileLesson = async (topic: string): Promise<LessonSpec> => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay
  
  // In a real app, this would call an API.
  // For now, we return a slightly modified version of the mock lesson
  return {
    ...mockRustLesson,
    id: `lesson-${Date.now()}`,
    title: `Mastering ${topic}`,
    topic: topic,
    description: `A comprehensive guide to ${topic} with interactive exercises.`,
    provenance: {
      generatorModel: "mock-llm-v1",
      promptBundleVersion: "v1.0.0",
    }
  };
};

export default function SettingsPage() {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "review" | "published">("idle");
  const [generatedLesson, setGeneratedLesson] = useState<LessonSpec | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setStatus("generating");
    setLogs([]);
    addLog(`Starting compilation for topic: "${topic}"...`);
    
    try {
      // Simulate pipeline stages
      await new Promise(r => setTimeout(r, 800));
      addLog("Step 1: Research Brief (Mocking Perplexity)...");
      addLog("Found 5 key sources. Identifying misconceptions...");
      
      await new Promise(r => setTimeout(r, 800));
      addLog("Step 2: Generating Lesson Skeleton...");
      addLog("PDCA structure defined. 4 stages, 8 blocks.");
      
      await new Promise(r => setTimeout(r, 800));
      addLog("Step 3: Authoring Blocks & Exercises...");
      
      const lesson = await compileLesson(topic);
      setGeneratedLesson(lesson);
      
      addLog("Step 4: Validating Schema...");
      addLog("Validation Passed. Ready for review.");
      setStatus("review");
    } catch (e) {
      addLog("Error: Compilation failed.");
      setStatus("idle");
    }
  };

  const handlePublish = () => {
    if (!generatedLesson) return;
    addLog(`Publishing lesson "${generatedLesson.title}" to store...`);
    // In a real app, we'd save to DB here
    setStatus("published");
    addLog("Lesson published successfully! Available in Learn runner.");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Ingestion Console</h1>
        <p className="text-stone-500 text-sm">Generate, validate, and publish new lessons.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-6">
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

          {/* Logs Console */}
          <div className="bg-stone-900 rounded-xl p-4 text-xs font-mono text-stone-400 h-64 overflow-y-auto border border-stone-800">
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

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          {status === "idle" || status === "generating" ? (
            <div className="h-full min-h-[400px] border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <p>Generated content will appear here</p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="border-b border-stone-100 bg-stone-50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-500" />
                  <span className="font-medium text-stone-900">Lesson Preview</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Validated</span>
                </div>
                <div className="flex gap-2">
                  {status === "review" && (
                    <button 
                      onClick={handlePublish}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Publish
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
              
              <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                {generatedLesson && (
                  <>
                    <div>
                      <h1 className="text-2xl font-bold text-stone-900">{generatedLesson.title}</h1>
                      <p className="text-stone-600 mt-2">{generatedLesson.description}</p>
                      <div className="flex gap-2 mt-4">
                        {generatedLesson.tags?.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-stone-900 border-b pb-2">Plan Stage</h3>
                      <div className="pl-4 border-l-2 border-stone-200 space-y-2">
                        {generatedLesson.stages.plan.blocks.map(b => (
                          <div key={b.id} className="text-sm text-stone-600 bg-stone-50 p-2 rounded border border-stone-100">
                            <span className="font-mono text-xs text-stone-400 uppercase mr-2">{b.type}</span>
                            {(b as any).markdown?.substring(0, 50) || (b as any).prompt?.substring(0, 50)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
