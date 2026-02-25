"use client";

import { FileBox, Search, Filter, FileText, Image as ImageIcon, LayoutTemplate, AlertTriangle, CheckCircle } from "lucide-react";

export default function LibraryPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Assets & Patterns</h1>
          <p className="text-stone-500 mt-2">Reference materials, templates, and failure catalogs.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Playbooks */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Playbook</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-blue-600 transition-colors">Incident Response Protocol</h3>
          <p className="text-sm text-stone-600 mb-4 line-clamp-2">Standard operating procedure for managing Sev-1 and Sev-2 production incidents.</p>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="px-2 py-1 bg-stone-100 rounded">Incident Response</span>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
              <LayoutTemplate className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Template</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-purple-600 transition-colors">Architecture Decision Record (ADR)</h3>
          <p className="text-sm text-stone-600 mb-4 line-clamp-2">Template for documenting architectural decisions, context, and consequences.</p>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="px-2 py-1 bg-stone-100 rounded">System Architecture</span>
          </div>
        </div>

        {/* Diagrams */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Diagram</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-emerald-600 transition-colors">Event Sourcing Pattern</h3>
          <p className="text-sm text-stone-600 mb-4 line-clamp-2">Visual representation of the event sourcing architecture pattern with CQRS.</p>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="px-2 py-1 bg-stone-100 rounded">System Architecture</span>
          </div>
        </div>

        {/* Failure Catalog */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Failure Case</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-rose-600 transition-colors">Cascading Failure: DB Connection Pool Exhaustion</h3>
          <p className="text-sm text-stone-600 mb-4 line-clamp-2">Analysis of a cascading failure caused by a slow downstream service exhausting the database connection pool.</p>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="px-2 py-1 bg-stone-100 rounded">Performance Optimization</span>
          </div>
        </div>

        {/* Exemplar Solutions */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Exemplar</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors">Secure OAuth 2.0 Implementation</h3>
          <p className="text-sm text-stone-600 mb-4 line-clamp-2">Reference implementation for a secure OAuth 2.0 authorization code flow with PKCE.</p>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="px-2 py-1 bg-stone-100 rounded">Security Auditing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
