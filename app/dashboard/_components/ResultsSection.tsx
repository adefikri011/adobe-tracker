"use client";
import { useState } from "react";
import { ResultCard, LockedCard, Asset } from "./ResultCard";
import { Search, TrendingUp, Lock } from "lucide-react";

function getTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_FILTERS = ["All Types", "Photo", "Video", "Vector", "Template"];

interface ResultsSectionProps {
  results: Asset[];
  query: string;
  isPro: boolean;
  fromCache: boolean;
  cachedAt: string | null;
  total?: number;
  onUpgradeClick: () => void;
  onExportCSV: () => void;
}

export function ResultsSection({
  results, query, isPro, fromCache, cachedAt, total,
  onUpgradeClick, onExportCSV,
}: ResultsSectionProps) {
  const [activeFilter, setActiveFilter] = useState("All Types");

  const filtered = activeFilter === "All Types"
    ? results
    : results.filter((r) => r.type.toLowerCase() === activeFilter.toLowerCase());

  const visibleResults = isPro ? filtered : filtered.slice(0, 6);
  const lockedResults = isPro ? [] : filtered.slice(6);

  return (
    <div className="space-y-6">
      {/* Header Section — horizontal layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title + Query */}
        <div className="flex items-center gap-3 flex-wrap">
          <Search size={20} className="text-orange-500" />
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Search Results</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">
                {total ?? results.length}
              </span>
              <span className="text-sm font-semibold text-slate-600">
                result{(total ?? results.length) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          
          {/* Query badge */}
          <span className="inline-block px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-2xl">
            <span className="text-xs font-bold text-orange-700">🔍 {query}</span>
          </span>
        </div>

        {/* Export button — samping kanan */}
        <button 
          onClick={onExportCSV}
          disabled={!isPro}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-xs transition-all whitespace-nowrap ${
            isPro 
              ? "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-700 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 active:scale-95" 
              : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
          }`}
          title={!isPro ? "CSV export available for Pro users only" : "Export search results to CSV"}>
          ⬇️ Export CSV
          {!isPro && <span className="text-slate-500">(Pro)</span>}
        </button>
      </div>

      {/* Sorted info — compact */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pb-2 border-b border-slate-200">
        <TrendingUp size={12} /> Sorted by popularity
      </div>

      {/* Filter tabs — lebih modern dengan hover effects */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-200">
        {TYPE_FILTERS.map((f) => (
          <button 
            key={f} 
            onClick={() => setActiveFilter(f)}
            className="px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap"
            style={{
              background: activeFilter === f 
                ? "linear-gradient(135deg, #f97316, #ea580c)" 
                : "#f8fafc",
              borderColor: activeFilter === f ? "#f97316" : "#e2e8f0",
              color: activeFilter === f ? "#ffffff" : "#64748b",
              border: activeFilter === f ? "none" : "1px solid #e2e8f0",
              boxShadow: activeFilter === f ? "0 2px 8px rgba(249,115,22,0.2)" : "none",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleResults.map((item, i) => (
          <ResultCard key={item.adobeId} item={item} index={i} />
        ))}
        {!isPro && lockedResults.length > 0 && (
          lockedResults.slice(0, 3).map((item) => (
            <LockedCard key={item.adobeId} />
          ))
        )}
      </div>

      {/* Free user info + Upgrade CTA — lebih prominent */}
      {!isPro && lockedResults.length > 0 && (
        <div className="relative mt-8">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
          <div className="relative rounded-3xl p-8 text-center max-w-2xl mx-auto border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
            {/* Lock Icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br from-orange-200 to-amber-200 shadow-md">
              <Lock size={24} className="text-orange-600" />
            </div>

            {/* Heading */}
            <h3 className="font-black text-xl mb-2 text-slate-900">
              See All {filtered.length} Results
            </h3>
            <p className="text-slate-600 text-sm font-medium mb-6 max-w-sm mx-auto">
              {lockedResults.length} more high-quality assets waiting to be discovered. Unlock unlimited access.
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 max-w-xs mx-auto">
              {["Unlimited results", "Full analytics", "Export to CSV", "Priority support"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                  <span className="w-4 h-4 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 text-[10px]">✓</span>
                  </span>
                  {f}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button 
              onClick={onUpgradeClick}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
              style={{ 
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                boxShadow: "0 8px 16px rgba(249,115,22,0.3)"
              }}>
              🚀 Upgrade to Pro — $9/month
            </button>
            <p className="text-slate-500 text-xs mt-3 font-medium">No commitment · Cancel anytime</p>
          </div>
        </div>
      )}
    </div>
  );
}