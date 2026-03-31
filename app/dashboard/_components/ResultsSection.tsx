"use client";
import { useState } from "react";
import { ResultCard, LockedCard, Asset } from "./ResultCard";

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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-sm sm:text-base text-gray-800">
              <span className="font-bold text-orange-500">{total ?? results.length}</span>
              {" "}results for{" "}
              <span className="text-orange-500">&ldquo;{query}&rdquo;</span>
            </h2>
            {fromCache ? (
              <span className="text-xs bg-green-50 border border-green-200 text-green-600 px-2 py-0.5 rounded-lg">
                ⚡ Cached {cachedAt ? getTimeAgo(cachedAt) : ""}
              </span>
            ) : (
              <span className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-lg">
                🔄 Live Data
              </span>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-0.5">Sorted by popularity</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onExportCSV}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-800">
            ⬇ Export CSV
            {!isPro && <span className="text-gray-400">(6 rows)</span>}
          </button>
          {!isPro && (
            <div className="bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg text-xs text-orange-600">
              6 of {filtered.length} shown ·{" "}
              <span onClick={onUpgradeClick} className="underline cursor-pointer font-semibold">
                Upgrade
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {TYPE_FILTERS.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all font-medium"
            style={{
              background: activeFilter === f ? "#f97316" : "#f8fafc",
              borderColor: activeFilter === f ? "#f97316" : "#e2e8f0",
              color: activeFilter === f ? "#fff" : "#64748b",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleResults.map((item, i) => (
          <ResultCard key={item.adobeId} item={item} index={i} />
        ))}
        {!isPro && lockedResults.length > 0 && (
          lockedResults.slice(0, 3).map((item) => (
            <LockedCard key={item.adobeId} />
          ))
        )}
      </div>

      {/* Upgrade CTA */}
      {!isPro && lockedResults.length > 0 && (
        <div className="relative mt-6">
          <div className="absolute -top-20 left-0 right-0 h-20 pointer-events-none z-10"
            style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }} />
          <div className="relative z-20 rounded-2xl p-6 sm:p-8 text-center mx-auto max-w-md border border-orange-200 bg-orange-50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl bg-orange-100">
              🔒
            </div>
            <h3 className="font-bold text-base mb-1 text-gray-800">Unlock All {filtered.length} Results</h3>
            <p className="text-gray-500 text-sm mb-5">
              {lockedResults.length} more assets hidden. Upgrade to Pro.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5 text-left">
              {["Unlimited results", "Full analytics", "Export CSV", "Priority support"].map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-green-500">✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={onUpgradeClick}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              Upgrade to Pro — $9/mo
            </button>
            <p className="text-gray-400 text-xs mt-3">No commitment · Cancel anytime</p>
          </div>
        </div>
      )}
    </div>
  );
}