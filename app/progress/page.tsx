"use client";

import { useProgressFeed } from "@/lib/hooks/use-data";
import { Activity, GitCommit, CheckCircle2, ShieldAlert, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProgressFeedPage() {
  const { data: progressEvents, loading } = useProgressFeed();

  if (loading) {
    return <div className="p-8 text-stone-500">Loading progress feed...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Telemetry Feed</h1>
          <p className="text-stone-500 mt-2">Evidence-based progression and quality control signals.</p>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1">
          <button className="px-3 py-1.5 text-sm font-medium bg-white text-stone-900 rounded-md shadow-sm">All Events</button>
          <button className="px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">Evidence Only</button>
          <button className="px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">Misconceptions</button>
        </div>
      </div>

      <div className="relative border-l-2 border-stone-200 ml-4 space-y-12 pb-12">
        {progressEvents.map((evt, idx) => {
          const isPositive = evt.title.includes('stabilized') || evt.title.includes('Completed');
          const isNegative = evt.title.includes('dropped');
          
          return (
            <div key={evt.id} className="relative pl-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              {/* Timeline dot */}
              <div className={cn(
                "absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center",
                isPositive ? "bg-emerald-500" : isNegative ? "bg-rose-500" : "bg-blue-500"
              )}>
                {isPositive ? <ArrowUpRight className="w-3 h-3 text-white" /> : 
                 isNegative ? <ArrowDownRight className="w-3 h-3 text-white" /> : 
                 <GitCommit className="w-3 h-3 text-white" />}
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-stone-900 text-lg">{evt.title}</h3>
                  <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">{evt.timestamp}</span>
                </div>
                
                <p className="text-stone-600 mb-5 leading-relaxed">{evt.details}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {evt.chips.map((chip, i) => (
                    <span 
                      key={i} 
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border",
                        chip.includes('pass') || chip.includes('free') 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : chip.includes('Error') || chip.includes('failed')
                          ? "bg-rose-50 text-rose-700 border-rose-100"
                          : "bg-stone-50 text-stone-700 border-stone-200"
                      )}
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    View Attempt Summary
                  </button>
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Evidence Gained</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> PDCA Closed</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
