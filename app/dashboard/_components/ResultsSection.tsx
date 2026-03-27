"use client";
import { ResultCard, LockedCard, Asset } from "./ResultCard";

function getTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface ResultsSectionProps {
  results: Asset[];
  query: string;
  isPro: boolean;
  fromCache: boolean;
  cachedAt: string | null;
  onUpgradeClick: () => void;
  onExportCSV: () => void;
}

export function ResultsSection({
  results,
  query,
  isPro,
  fromCache,
  cachedAt,
  onUpgradeClick,
  onExportCSV,
}: ResultsSectionProps) {
  const visibleResults = isPro ? results : results.slice(0, 6);
  const lockedResults = isPro ? [] : results.slice(6);

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-sm sm:text-base">
              Results for{" "}
              <span className="text-orange-500">&ldquo;{query}&rdquo;</span>
            </h2>
            {fromCache ? (
              <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-1 rounded-lg">
                ⚡ Cached {cachedAt ? getTimeAgo(cachedAt) : ""}
              </span>
            ) : (
              <span className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-1 rounded-lg">
                🔄 Live Data
              </span>
            )}
          </div>
          <p className="text-white/30 text-xs mt-0.5">
            {results.length} assets · Sorted by downloads
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition px-3 sm:px-4 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white"
          >
            ⬇ Export CSV
            {!isPro && <span className="text-white/25">(6 rows)</span>}
          </button>
          {!isPro && (
            <div className="bg-orange-500/10 border border-orange-500/30 px-3 py-2 rounded-lg text-xs text-orange-400">
              6 of {results.length} shown ·{" "}
              <span onClick={onUpgradeClick} className="underline cursor-pointer">
                Upgrade
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Card Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleResults.map((item, i) => (
          <ResultCard key={item.adobeId} item={item} index={i} />
        ))}

        {/* Locked cards */}
        {!isPro && lockedResults.length > 0 && (
          <>
            {lockedResults.slice(0, 3).map((item) => (
              <LockedCard key={item.adobeId} />
            ))}
          </>
        )}
      </div>

      {/* ── Locked Upgrade Overlay ── */}
      {!isPro && lockedResults.length > 0 && (
        <div className="relative mt-6">
          {/* Fade mask */}
          <div
            className="absolute -top-20 left-0 right-0 h-20 pointer-events-none z-10"
            style={{
              background: "linear-gradient(to bottom, transparent, #0a0a0a)",
            }}
          />

          {/* CTA */}
          <div
            className="relative z-20 rounded-2xl p-6 sm:p-8 text-center mx-auto max-w-md"
            style={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(249,115,22,0.25)",
              boxShadow: "0 0 40px rgba(249,115,22,0.08)",
            }}
          >
            <div
              className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
              style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}
            >
              🔒
            </div>
            <h3 className="font-bold text-base mb-1">Unlock All {results.length} Results</h3>
            <p className="text-white/40 text-sm mb-5">
              {lockedResults.length} more assets are hidden. Upgrade to Pro to see everything.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5 text-left">
              {[
                "Unlimited search results",
                "Full analytics data",
                "Export CSV / Excel",
                "Priority support",
              ].map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-white/50">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={onUpgradeClick}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                boxShadow: "0 0 24px rgba(249,115,22,0.35)",
              }}
            >
              Upgrade to Pro — $9/mo
            </button>
            <p className="text-white/20 text-xs mt-3">No commitment · Cancel anytime</p>
          </div>
        </div>
      )}
    </div>
  );
}