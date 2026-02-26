"use client";

import { useState, useEffect } from "react";
import { eventStore } from "@/lib/events/store";
import { lessonStore } from "@/lib/data/lesson-store";
import { skillLoader } from "@/lib/skills/loader";
import {
  projectPracticeQueue,
  PracticeQueueItem,
} from "@/lib/events/read-models";
import Link from "next/link";
import {
  Dumbbell,
  AlertCircle,
  Clock,
  TrendingDown,
  Lightbulb,
  RefreshCw,
  Play,
  Settings2,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REASON_CONFIG = {
  regression: {
    label: "Regression",
    sublabel: "Confidence dropped below threshold",
    icon: TrendingDown,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    badgeColor: "bg-rose-100 text-rose-700",
  },
  "hint-dependent": {
    label: "Hint-Dependent",
    sublabel: "Used hints 2+ times — needs independent practice",
    icon: Lightbulb,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  "stale-risk": {
    label: "Stale Risk",
    sublabel: "Content may be outdated — revisit before it expires",
    icon: RefreshCw,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  misconception: {
    label: "Misconception",
    sublabel: "Incorrect answer pattern detected",
    icon: AlertCircle,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    dot: "bg-purple-500",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  "transfer-not-proven": {
    label: "Transfer Not Proven",
    sublabel: "Knowledge transfer to new contexts unverified",
    icon: CheckCircle2,
    color: "text-stone-700",
    bg: "bg-stone-50",
    border: "border-stone-200",
    dot: "bg-stone-400",
    badgeColor: "bg-stone-100 text-stone-600",
  },
} as const;

const SESSION_LENGTHS = ["5 min", "10 min", "20 min"] as const;
type SessionLength = (typeof SESSION_LENGTHS)[number];

export default function PracticePage() {
  const [queue, setQueue] = useState<PracticeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLength, setSelectedLength] = useState<SessionLength>("10 min");
  const [focusFilter, setFocusFilter] = useState<
    PracticeQueueItem["reason"] | "all"
  >("all");

  useEffect(() => {
    async function load() {
      try {
        const events = eventStore.listEvents();
        const publishedLessons = lessonStore.getAllPublishedLessons();
        const now = new Date().toISOString();
        const derived = projectPracticeQueue(events, publishedLessons, now);
        setQueue(derived);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const reasonCounts = queue.reduce(
    (acc, item) => {
      acc[item.reason] = (acc[item.reason] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const filteredQueue =
    focusFilter === "all"
      ? queue
      : queue.filter((item) => item.reason === focusFilter);

  // Determine how many items to show based on session length
  const itemsForSession =
    selectedLength === "5 min" ? 3 : selectedLength === "10 min" ? 6 : 12;
  const sessionQueue = filteredQueue.slice(0, itemsForSession);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Adaptive Drill
          </h1>
          <p className="text-stone-500 mt-2">
            Spaced repetition and interleaved practice from your event history.
          </p>
        </div>
      </div>

      {/* Stats row */}
      {!loading && queue.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {(
            [
              ["regression", "Regressions"],
              ["hint-dependent", "Hint-Dependent"],
              ["stale-risk", "Stale Risk"],
            ] as const
          ).map(([reason, label]) => {
            const count = reasonCounts[reason] ?? 0;
            const cfg = REASON_CONFIG[reason];
            const Icon = cfg.icon;
            return (
              <div
                key={reason}
                className={cn(
                  "rounded-xl p-4 border flex items-start gap-3",
                  cfg.bg,
                  cfg.border
                )}
              >
                <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", cfg.color)} />
                <div>
                  <p className={cn("text-2xl font-bold", cfg.color)}>{count}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Config Panel */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100">
          <Settings2 className="w-5 h-5 text-stone-400" />
          <h2 className="text-lg font-medium text-stone-900">
            Session Configuration
          </h2>
        </div>

        <div className="space-y-6">
          {/* Session length */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Session Length
            </label>
            <div className="flex gap-3">
              {SESSION_LENGTHS.map((len) => (
                <button
                  key={len}
                  onClick={() => setSelectedLength(len)}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all",
                    selectedLength === len
                      ? "border-stone-900 text-stone-900 bg-stone-50"
                      : "border-stone-200 text-stone-500 hover:border-stone-400"
                  )}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Focus area filter */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Focus Area
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFocusFilter("all")}
                className={cn(
                  "p-4 rounded-lg border-2 font-medium text-left flex flex-col gap-1 transition-all",
                  focusFilter === "all"
                    ? "border-stone-900 bg-stone-50 text-stone-900"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                <span>Mixed Interleave</span>
                <span className="text-xs font-normal text-stone-500">
                  All signal types, prioritised by urgency
                </span>
              </button>
              {(["regression", "hint-dependent", "stale-risk"] as const).map(
                (reason) => {
                  const cfg = REASON_CONFIG[reason];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={reason}
                      onClick={() => setFocusFilter(reason)}
                      className={cn(
                        "p-4 rounded-lg border-2 font-medium text-left flex flex-col gap-1 transition-all",
                        focusFilter === reason
                          ? cn(
                            "border-2",
                            cfg.border,
                            cfg.bg,
                            cfg.color
                          )
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                      <span className="text-xs font-normal text-stone-500">
                        {(reasonCounts[reason] ?? 0)} items due
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Queue preview */}
      {loading ? (
        <div className="text-stone-400 text-sm py-8 text-center">
          Loading practice queue…
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex gap-4 items-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-900 mb-1">
              Queue Empty — You&apos;re Up to Date!
            </h4>
            <p className="text-sm text-emerald-700">
              No regressions, hint-dependent items, or stale lessons detected.
              Keep going!
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 p-5 pb-4 border-b border-stone-100">
            <Dumbbell className="w-5 h-5 text-stone-400" />
            <h3 className="font-medium text-stone-900">
              Upcoming Drill Items
            </h3>
            <span className="ml-auto text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {sessionQueue.length} of {filteredQueue.length}
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {sessionQueue.map((item, idx) => {
              const cfg = REASON_CONFIG[item.reason];
              const Icon = cfg.icon;

              return (
                <div
                  key={`${item.lessonId}-${item.blockId ?? idx}`}
                  className="p-5 flex items-start gap-4 hover:bg-stone-50 transition-colors"
                >
                  {/* Priority indicator */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        cfg.dot
                      )}
                    />
                    <span className="text-[10px] font-mono text-stone-400">
                      {item.priority}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900 text-sm">
                          {item.lessonId}
                        </p>
                        {item.blockId && (
                          <p className="text-xs text-stone-500 mt-0.5">
                            Block: {item.blockId}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 shrink-0",
                          cfg.badgeColor
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1.5">
                      {cfg.sublabel}
                    </p>
                  </div>

                  <Link
                    href={`/learn?lessonId=${item.lessonId}`}
                    className="shrink-0 text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>

          {filteredQueue.length > itemsForSession && (
            <div className="p-4 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-500">
                +{filteredQueue.length - itemsForSession} more items hidden.
                Extend your session to see them.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Due alert if queue has items */}
      {!loading && queue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900 mb-1">
              Due for Review
            </h4>
            <p className="text-sm text-amber-700">
              You have {queue.length} item
              {queue.length !== 1 ? "s" : ""} due for spaced retrieval across{" "}
              {new Set(queue.map((i) => i.lessonId)).size} lesson
              {new Set(queue.map((i) => i.lessonId)).size !== 1 ? "s" : ""}.
            </p>
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        className="w-full bg-stone-900 text-white py-4 rounded-xl font-medium text-lg hover:bg-stone-800 active:bg-stone-950 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        disabled={loading || sessionQueue.length === 0}
      >
        <Play className="w-5 h-5 fill-white" />
        Start Drill{" "}
        {sessionQueue.length > 0 ? `(${sessionQueue.length} items)` : ""}
      </button>

      {loading && (
        <div className="flex items-center gap-2 text-stone-400 text-sm justify-center">
          <Clock className="w-4 h-4 animate-spin" />
          Loading queue…
        </div>
      )}
    </div>
  );
}
