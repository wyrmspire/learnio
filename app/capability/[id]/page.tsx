"use client";

import { useParams } from "next/navigation";
import { useCapability, useProgressFeed } from "@/lib/hooks/use-data";
import { ArrowLeft, GitMerge, ShieldAlert, Calendar, FileBox, Activity, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function CapabilityDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: capability, loading: capLoading } = useCapability(id);
  const { data: progressEvents, loading: progLoading } = useProgressFeed();

  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'misconceptions' | 'schedule' | 'assets'>('overview');

  if (capLoading || progLoading) {
    return <div className="p-8 text-stone-500">Loading capability details...</div>;
  }

  if (!capability) {
    return <div className="p-8 text-rose-500">Capability not found.</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: GitMerge },
    { id: 'evidence', label: 'Evidence', icon: Activity },
    { id: 'misconceptions', label: 'Misconceptions', icon: ShieldAlert },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'assets', label: 'Assets', icon: FileBox },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/" className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{capability.name}</h1>
          <div className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider",
            capability.stability === 'high' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
            capability.stability === 'medium' ? "bg-amber-50 text-amber-700 border border-amber-200" :
            "bg-rose-50 text-rose-700 border border-rose-200"
          )}>
            {capability.stability} Stability
          </div>
        </div>
      </div>

      <p className="text-stone-600 max-w-3xl">{capability.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-center">
          <div className="text-sm text-stone-500 mb-2">Mastery Confidence</div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-light text-stone-900">{Math.round(capability.confidence * 100)}%</span>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                capability.confidence > 0.7 ? "bg-emerald-500" :
                capability.confidence > 0.4 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${capability.confidence * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-center">
          <div className="text-sm text-stone-500 mb-2">Next Recommended Action</div>
          <div className="text-lg font-medium text-blue-600 mb-3">{capability.nextAction}</div>
          <Link href="/learn" className="text-sm font-medium text-stone-900 hover:text-blue-700 underline underline-offset-4">
            Start Session &rarr;
          </Link>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-center">
          <div className="text-sm text-stone-500 mb-2">Weakest Sub-skill</div>
          <div className="text-lg font-medium text-rose-600 mb-3">{capability.weakestTag}</div>
          <div className="text-xs text-stone-500">Based on recent misconception tags</div>
        </div>
      </div>

      <div className="border-b border-stone-200">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors",
                activeTab === tab.id 
                  ? "border-stone-900 text-stone-900" 
                  : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-medium text-stone-900">Capability Map</h3>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center text-stone-500 flex flex-col items-center gap-4">
                <GitMerge className="w-8 h-8 text-stone-300" />
                <p>Interactive Dependency Graph Placeholder</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Mastered</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div> In Progress</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-stone-300"></div> Locked</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-medium text-stone-900">Recent Evidence</h3>
            <div className="space-y-4">
              {progressEvents.map(evt => (
                <div key={evt.id} className="bg-white border border-stone-200 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-stone-900">{evt.title}</h4>
                    <span className="text-xs text-stone-500">{evt.timestamp}</span>
                  </div>
                  <p className="text-sm text-stone-600 mb-4">{evt.details}</p>
                  <div className="flex flex-wrap gap-2">
                    {evt.chips.map((chip, i) => (
                      <span key={i} className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs font-medium">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'misconceptions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-medium text-stone-900">Active Misconceptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-rose-800 font-medium mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  {capability.weakestTag}
                </div>
                <p className="text-sm text-rose-700 mb-4">
                  You frequently confuse CPU utilization with actual system throughput bottlenecks.
                </p>
                <button className="text-sm font-medium text-rose-800 underline underline-offset-4">
                  Review Failure Cases
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
