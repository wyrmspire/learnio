"use client";

import { Database, FileCode2, Settings2, ShieldCheck, UploadCloud, Users } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Admin & Authoring</h1>
          <p className="text-stone-500 mt-2">Manage curriculum, ingestion pipelines, and platform settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Curriculum Builder */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-stone-400" />
            Curriculum Builder
          </h2>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors flex items-center justify-between">
              <div>
                <h3 className="font-medium text-stone-900">Capability Management</h3>
                <p className="text-sm text-stone-500">Create and edit Capability Units (CUs).</p>
              </div>
              <span className="text-stone-400">&rarr;</span>
            </div>
            <div className="p-4 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors flex items-center justify-between">
              <div>
                <h3 className="font-medium text-stone-900">Exercise Bank</h3>
                <p className="text-sm text-stone-500">Manage interactive exercises and rubrics.</p>
              </div>
              <span className="text-stone-400">&rarr;</span>
            </div>
            <div className="p-4 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors flex items-center justify-between">
              <div>
                <h3 className="font-medium text-stone-900">Test Bank</h3>
                <p className="text-sm text-stone-500">Configure process and transfer tests.</p>
              </div>
              <span className="text-stone-400">&rarr;</span>
            </div>
            <div className="p-4 hover:bg-stone-50 cursor-pointer transition-colors flex items-center justify-between">
              <div>
                <h3 className="font-medium text-stone-900">Citation Manager</h3>
                <p className="text-sm text-stone-500">Link external references and assets.</p>
              </div>
              <span className="text-stone-400">&rarr;</span>
            </div>
          </div>
        </div>

        {/* Ingestion Console */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-stone-400" />
            Ingestion Pipeline
          </h2>
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-stone-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    Run Research (Perplexity)
                  </h3>
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Ready</span>
                </div>
                <p className="text-sm text-stone-600 mb-3">Generate raw briefs for new capabilities.</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Topic..." className="flex-1 border border-stone-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
                  <button className="bg-stone-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors">Run</button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-stone-600">
                <div className="flex-1 h-px bg-stone-200"></div>
                <span>Pipeline Stages</span>
                <div className="flex-1 h-px bg-stone-200"></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border border-stone-200 rounded-lg bg-white">
                  <span className="text-sm font-medium text-stone-700">1. Compile to DSL</span>
                  <button className="text-xs font-medium text-stone-500 hover:text-stone-900">Execute</button>
                </div>
                <div className="flex items-center justify-between p-3 border border-stone-200 rounded-lg bg-white">
                  <span className="text-sm font-medium text-stone-700 flex items-center gap-2">
                    2. Validation Gate
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </span>
                  <button className="text-xs font-medium text-stone-500 hover:text-stone-900">View Results</button>
                </div>
                <div className="flex items-center justify-between p-3 border border-stone-200 rounded-lg bg-white">
                  <span className="text-sm font-medium text-stone-700">3. Publish to Production</span>
                  <button className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100">Publish</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="space-y-6 md:col-span-2">
          <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-stone-400" />
            Platform Configuration
          </h2>
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-6">
             <div className="flex-1 border border-stone-200 rounded-lg p-4 flex items-start gap-4 hover:border-stone-300 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900 mb-1">Multi-tenant Organizations</h3>
                  <p className="text-sm text-stone-500">Manage company workspaces, SSO, and roles.</p>
                </div>
             </div>
             <div className="flex-1 border border-stone-200 rounded-lg p-4 flex items-start gap-4 hover:border-stone-300 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900 mb-1">Database Connections</h3>
                  <p className="text-sm text-stone-500">Configure Postgres and Redis endpoints.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
