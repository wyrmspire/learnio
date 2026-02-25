"use client";

import { useCapabilities } from "@/lib/hooks/use-data";
import { ArrowRight, Activity, Zap, Target, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: capabilities, loading } = useCapabilities();
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'mock';

  if (loading) {
    return <div className="p-8 text-stone-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Capability Control Room</h1>
          <p className="text-stone-500 mt-2">Your current mastery state and next best actions.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono bg-stone-100 text-stone-500 px-2 py-1 rounded border border-stone-200">
            Mode: {dataMode}
          </div>
          <button className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Start Recommended Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Capabilities Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-medium text-stone-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-stone-400" />
            Active Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((cap) => (
              <Link key={cap.id} href={`/capability/${cap.id}`} className="block group">
                <div className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 hover:shadow-sm transition-all h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">{cap.name}</h3>
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-medium uppercase tracking-wider",
                      cap.stability === 'high' ? "bg-emerald-50 text-emerald-700" :
                      cap.stability === 'medium' ? "bg-amber-50 text-amber-700" :
                      "bg-rose-50 text-rose-700"
                    )}>
                      {cap.stability}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Confidence</span>
                      <span className="font-medium text-stone-900">{Math.round(cap.confidence * 100)}%</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          cap.confidence > 0.7 ? "bg-emerald-500" :
                          cap.confidence > 0.4 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${cap.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="truncate">Weakest: <span className="font-medium text-stone-700">{cap.weakestTag}</span></span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-blue-600 flex items-center gap-1">
                        {cap.nextAction}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      {cap.dueReviewsCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          {cap.dueReviewsCount} due
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-white rounded-xl p-6">
            <h3 className="font-medium flex items-center gap-2 mb-4 text-stone-100">
              <Zap className="w-5 h-5 text-amber-400" />
              Next 15 Minutes
            </h3>
            <p className="text-sm text-stone-400 mb-6">
              You have a micro-PDCA session ready for <strong className="text-white font-medium">Incident Response</strong>.
            </p>
            <button className="w-full bg-white text-stone-900 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors">
              Start Quick Session
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h3 className="font-medium text-stone-900 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              Quality Signals
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Hint Dependency</span>
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                  ↓ 12% <span className="text-stone-400 font-normal text-xs">trending down</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Transfer Success</span>
                <span className="text-sm font-medium text-stone-900">
                  84% <span className="text-stone-400 font-normal text-xs">last 30 days</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Time-to-correctness</span>
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                  ↓ 4m <span className="text-stone-400 font-normal text-xs">faster</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h3 className="font-medium text-stone-900 flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-rose-500" />
              Bottleneck Spotlight
            </h3>
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
              <h4 className="text-sm font-semibold text-rose-900 mb-1">Security Auditing</h4>
              <p className="text-xs text-rose-700 mb-3">Confidence is critically low (15%). This is blocking 2 downstream capabilities.</p>
              <Link href="/learn?cu=threat-modeling" className="text-sm font-medium text-rose-700 hover:text-rose-800 flex items-center gap-1">
                Run CU-1: Threat Modeling <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
