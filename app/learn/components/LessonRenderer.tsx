import { 
  LessonBlock, 
  ExplainerBlock, 
  DiagramBlock, 
  ScenarioBlock, 
  PredictionBlock, 
  ExerciseBlock, 
  QuizBlock, 
  ReflectionBlock, 
  TodoBlock 
} from "@/lib/contracts/lesson";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Lightbulb } from "lucide-react";

interface BlockProps<T extends LessonBlock> {
  block: T;
  onInteract?: (interaction: any) => void;
}

// --- Block Components ---

function ExplainerRenderer({ block }: BlockProps<ExplainerBlock>) {
  return (
    <div className="prose prose-stone max-w-none">
      <ReactMarkdown>{block.markdown}</ReactMarkdown>
    </div>
  );
}

function DiagramRenderer({ block }: BlockProps<DiagramBlock>) {
  return (
    <div className="my-6 border border-stone-200 rounded-lg p-4 bg-stone-50">
      <div className="font-mono text-xs text-stone-500 mb-2 uppercase tracking-wider">
        {block.diagramType} Diagram
      </div>
      <pre className="text-xs overflow-x-auto bg-white p-4 rounded border border-stone-100">
        {block.content}
      </pre>
      {block.caption && (
        <p className="text-center text-sm text-stone-500 mt-2 italic">{block.caption}</p>
      )}
    </div>
  );
}

function ScenarioRenderer({ block }: BlockProps<ScenarioBlock>) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 my-4">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">{block.title}</h3>
      <p className="text-blue-800 leading-relaxed">{block.description}</p>
    </div>
  );
}

function PredictionRenderer({ block, onInteract }: BlockProps<PredictionBlock>) {
  const [prediction, setPrediction] = useState("");
  const [committed, setCommitted] = useState(false);

  const handleCommit = () => {
    setCommitted(true);
    onInteract?.({ type: "commit_prediction", value: prediction });
  };

  return (
    <div className="space-y-4 my-6 border-l-4 border-stone-300 pl-4 py-2">
      <label className="block text-sm font-medium text-stone-900">
        Prediction <span className="text-rose-500">*</span>
      </label>
      <p className="text-stone-600">{block.prompt}</p>
      
      <textarea
        className="w-full border border-stone-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-stone-500 outline-none transition-all"
        rows={3}
        placeholder={block.placeholder}
        value={prediction}
        onChange={(e) => setPrediction(e.target.value)}
        disabled={committed}
      />
      
      {!committed ? (
        <button
          onClick={handleCommit}
          disabled={!prediction.trim()}
          className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
        >
          Commit Prediction
        </button>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-4">
            <CheckCircle2 className="w-4 h-4" />
            Prediction Locked
          </div>
          {block.correctAnswerReveal && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-emerald-900 mb-1">The Reality:</h4>
              <p className="text-sm text-emerald-800">{block.correctAnswerReveal}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseRenderer({ block }: BlockProps<ExerciseBlock>) {
  const [code, setCode] = useState(block.initialCode || "");
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="space-y-4 my-6">
      <div className="font-medium text-stone-900">{block.prompt}</div>
      
      {/* Mock Code Editor */}
      <div className="relative group">
        <div className="absolute top-0 right-0 px-2 py-1 bg-stone-800 text-stone-400 text-xs rounded-bl-lg rounded-tr-lg font-mono">
          {block.language || "text"}
        </div>
        <textarea
          className="w-full bg-stone-900 text-stone-100 font-mono text-sm p-4 rounded-lg min-h-[200px] outline-none focus:ring-2 focus:ring-blue-500"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Run Code
          </button>
          <button className="bg-stone-100 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors border border-stone-200">
            Submit Attempt
          </button>
        </div>

        {block.hints.length > 0 && (
          <div className="flex flex-col items-end gap-2">
            {hintsRevealed < block.hints.length ? (
              <button 
                onClick={() => setHintsRevealed(h => h + 1)}
                className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                Need a Hint? ({block.hints.length - hintsRevealed} left)
              </button>
            ) : (
              <span className="text-xs text-stone-400">All hints revealed</span>
            )}
          </div>
        )}
      </div>

      {/* Hints Display */}
      <div className="space-y-2">
        {block.hints.slice(0, hintsRevealed).map((hint, idx) => (
          <div key={idx} className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-sm text-amber-800 animate-in fade-in slide-in-from-top-1">
            <span className="font-bold mr-2">Hint {idx + 1}:</span> {hint}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizRenderer({ block }: BlockProps<QuizBlock>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = block.options.find(o => o.id === selected)?.isCorrect;

  return (
    <div className="my-6 border border-stone-200 rounded-xl p-6 bg-white shadow-sm">
      <h3 className="font-medium text-stone-900 mb-4">{block.question}</h3>
      <div className="space-y-2">
        {block.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => !submitted && setSelected(opt.id)}
            disabled={submitted}
            className={cn(
              "w-full text-left p-3 rounded-lg border text-sm transition-all flex items-center justify-between",
              selected === opt.id 
                ? "border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500" 
                : "border-stone-200 hover:bg-stone-50 text-stone-700",
              submitted && opt.isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500",
              submitted && selected === opt.id && !opt.isCorrect && "border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-500"
            )}
          >
            {opt.text}
            {submitted && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {submitted && selected === opt.id && !opt.isCorrect && <AlertCircle className="w-4 h-4 text-rose-600" />}
          </button>
        ))}
      </div>

      {!submitted && selected && (
        <button
          onClick={() => setSubmitted(true)}
          className="mt-4 w-full bg-stone-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          Check Answer
        </button>
      )}

      {submitted && (
        <div className={cn(
          "mt-4 p-4 rounded-lg text-sm animate-in fade-in slide-in-from-top-2",
          isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
        )}>
          <p className="font-semibold mb-1">{isCorrect ? "Correct!" : "Not quite."}</p>
          <p>{block.options.find(o => o.id === selected)?.feedback}</p>
        </div>
      )}
    </div>
  );
}

function ReflectionRenderer({ block }: BlockProps<ReflectionBlock>) {
  return (
    <div className="my-6 space-y-2">
      <label className="block text-sm font-medium text-stone-900">{block.prompt}</label>
      <textarea
        className="w-full border border-stone-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
        rows={3}
        placeholder="My thoughts..."
      />
    </div>
  );
}

function TodoRenderer({ block }: BlockProps<TodoBlock>) {
  const [checked, setChecked] = useState(false);
  return (
    <div 
      onClick={() => setChecked(!checked)}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all my-2",
        checked ? "bg-stone-50 border-stone-200" : "bg-white border-stone-200 hover:border-stone-300"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
        checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-300 bg-white"
      )}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
      </div>
      <span className={cn("text-sm", checked ? "text-stone-400 line-through" : "text-stone-700")}>
        {block.text}
      </span>
    </div>
  );
}

// --- Main Renderer ---

export function LessonBlockRenderer({ block, onInteract }: BlockProps<LessonBlock>) {
  switch (block.type) {
    case "explainer": return <ExplainerRenderer block={block} onInteract={onInteract} />;
    case "diagram": return <DiagramRenderer block={block} onInteract={onInteract} />;
    case "scenario": return <ScenarioRenderer block={block} onInteract={onInteract} />;
    case "prediction": return <PredictionRenderer block={block} onInteract={onInteract} />;
    case "exercise": return <ExerciseRenderer block={block} onInteract={onInteract} />;
    case "quiz": return <QuizRenderer block={block} onInteract={onInteract} />;
    case "reflection": return <ReflectionRenderer block={block} onInteract={onInteract} />;
    case "todo": return <TodoRenderer block={block} onInteract={onInteract} />;
    default: return <div className="text-rose-500 text-xs">Unknown block type: {(block as any).type}</div>;
  }
}
