"use client";

import { CheckSquare, ShieldCheck, Trophy, ArrowRight, Lock } from "lucide-react";

export default function AssessPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Quality Gate Tests</h1>
          <p className="text-stone-500 mt-2">Prove transfer and earn capability badges.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Process Test */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col h-full hover:border-blue-300 transition-colors cursor-pointer group">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-blue-100 transition-colors">
            <CheckSquare className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-3">Process Test</h2>
          <p className="text-stone-600 mb-6 flex-1 text-sm leading-relaxed">
            End-of-capability group assessment. Verifies you can execute the standard process without hints.
          </p>
          <div className="flex items-center justify-between text-sm font-medium text-blue-600 pt-4 border-t border-stone-100">
            <span>2 Available</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Transfer Test */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col h-full hover:border-emerald-300 transition-colors cursor-pointer group">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-3">Transfer Test</h2>
          <p className="text-stone-600 mb-6 flex-1 text-sm leading-relaxed">
            Apply your capability to a novel, unseen scenario. Proves deep understanding over memorization.
          </p>
          <div className="flex items-center justify-between text-sm font-medium text-emerald-600 pt-4 border-t border-stone-100">
            <span>1 Ready</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Certification Run */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-4 right-4 text-stone-400">
            <Lock className="w-5 h-5" />
          </div>
          <div className="w-12 h-12 bg-stone-200 rounded-lg flex items-center justify-center mb-6 border border-stone-300 opacity-50">
            <Trophy className="w-6 h-6 text-stone-500" />
          </div>
          <h2 className="text-xl font-semibold text-stone-400 mb-3">Certification Run</h2>
          <p className="text-stone-400 mb-6 flex-1 text-sm leading-relaxed">
            Longer, timed assessment across multiple capability groups. Unlocks formal credentials.
          </p>
          <div className="flex items-center justify-between text-sm font-medium text-stone-400 pt-4 border-t border-stone-200">
            <span>Locked (Requires 3 Transfer Passes)</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm mt-12">
        <h3 className="text-lg font-medium text-stone-900 mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Badge Rules
        </h3>
        <ul className="space-y-4 text-stone-600 text-sm">
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 shrink-0" />
            <p><strong className="text-stone-900 font-medium">Transfer Proven:</strong> Badges only appear after passing a novel scenario test.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 shrink-0" />
            <p><strong className="text-stone-900 font-medium">Zero-Hint Completion:</strong> Must complete the assessment without accessing the hint ladder.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 shrink-0" />
            <p><strong className="text-stone-900 font-medium">Failure Diagnosis Mastery:</strong> Must correctly identify the root cause of a broken system.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 shrink-0" />
            <p><strong className="text-stone-900 font-medium">Consistent Performance:</strong> Must maintain high confidence across spaced retrieval sessions.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
