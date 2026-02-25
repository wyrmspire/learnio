"use client";

import { Dumbbell, Settings2, Play, AlertCircle, Clock } from "lucide-react";

export default function PracticePage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Adaptive Drill</h1>
          <p className="text-stone-500 mt-2">Spaced repetition and interleaved practice.</p>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100">
          <Settings2 className="w-5 h-5 text-stone-400" />
          <h2 className="text-lg font-medium text-stone-900">Session Configuration</h2>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Session Length</label>
            <div className="flex gap-4">
              {['5 min', '10 min', '20 min'].map(len => (
                <button 
                  key={len} 
                  className="flex-1 py-3 px-4 rounded-lg border-2 border-stone-200 text-stone-600 font-medium hover:border-stone-900 hover:text-stone-900 transition-colors focus:ring-2 focus:ring-stone-900 focus:outline-none"
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Focus Area</label>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 rounded-lg border-2 border-stone-900 bg-stone-50 text-stone-900 font-medium text-left flex flex-col gap-1">
                <span>Mixed Interleave</span>
                <span className="text-xs font-normal text-stone-500">70% weak / 30% strong</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-stone-200 text-stone-600 font-medium text-left flex flex-col gap-1 hover:border-stone-300">
                <span>Targeted Capability</span>
                <span className="text-xs font-normal text-stone-500">Focus on a specific weak area</span>
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900 mb-1">Due for Review</h4>
              <p className="text-sm text-amber-700">You have 8 items due for spaced retrieval across 3 capabilities.</p>
            </div>
          </div>

          <button className="w-full bg-stone-900 text-white py-4 rounded-xl font-medium text-lg hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 shadow-sm">
            <Play className="w-5 h-5 fill-white" />
            Start Drill
          </button>
        </div>
      </div>
    </div>
  );
}
