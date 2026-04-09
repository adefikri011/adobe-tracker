"use client";

import React, { useState, useRef } from "react";
import {
  RefreshCw, CheckCircle2, AlertCircle,
  Database, Zap, Clock, Layers, TrendingUp, Plus
} from "lucide-react";

type SyncPhase = "idle" | "syncing" | "saving" | "done" | "error";

interface SyncProgress {
  phase: SyncPhase;
  currentPage: number;
  totalPages: number;
  totalCollected: number;
  currentPageItems: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
  created: number;
  updated: number;
  totalInDatabase: number;
  errorMessage: string;
  logs: string[];
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function ApiIntegrationPage() {
  const [lastSync, setLastSync] = useState("Not synced yet");
  const [totalAssets, setTotalAssets] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [apifyUsage, setApifyUsage] = useState({ current: 0, limit: 5.0 });
  const [syncLimit, setSyncLimit] = useState(1000); // Default 1000 items for local testing
  const [searchQuery, setSearchQuery] = useState(""); // Empty = all types of assets
  const [progress, setProgress] = useState<SyncProgress>({
    phase: "idle",
    currentPage: 0,
    totalPages: 10,
    totalCollected: 0,
    currentPageItems: 0,
    elapsedMs: 0,
    estimatedRemainingMs: 0,
    created: 0,
    updated: 0,
    totalInDatabase: 0,
    errorMessage: "",
    logs: [],
  });

  const abortRef = useRef<AbortController | null>(null);

  // Fetch database stats on mount and after sync
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/api-stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTotalAssets(data.totalAssets || 0);
        setEstimatedCost(data.estimatedCost || 0);
        setApifyUsage(data.apifyUsage || { current: 0, limit: 5.0 });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Load initial stats on mount
  React.useEffect(() => {
    fetchStats();
  }, []);

  const isSyncing = progress.phase === "syncing" || progress.phase === "saving";

  const handleSync = async () => {
    if (isSyncing) return;

    abortRef.current = new AbortController();

    setProgress({
      phase: "syncing",
      currentPage: 0,
      totalPages: Math.ceil(syncLimit / 10),
      totalCollected: 0,
      currentPageItems: 0,
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      created: 0,
      updated: 0,
      totalInDatabase: 0,
      errorMessage: "",
      logs: ["Connecting to Apify..."],
    });

    try {
      const response = await fetch(`/api/adobe/sync?limit=${syncLimit}&query=${encodeURIComponent(searchQuery)}`, {
        method: "POST",
        signal: abortRef.current.signal,
      });

      if (!response.body) throw new Error("No response stream available");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleSSEEvent(event);
          } catch {}
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setProgress((prev) => ({
        ...prev,
        phase: "error",
        errorMessage: e?.message || "Connection failed",
      }));
    }
  };

  const handleSSEEvent = (event: any) => {
    setProgress((prev) => {
      const newLog = event.message ? `${event.message}` : null;
      const logs = newLog ? [...prev.logs.slice(-6), newLog] : prev.logs;

      switch (event.type) {
        case "start":
          return { ...prev, phase: "syncing", totalPages: event.totalPages ?? 10, logs };

        case "page_start":
          return {
            ...prev,
            phase: "syncing",
            currentPage: event.page,
            totalPages: event.totalPages,
            totalCollected: event.totalCollected ?? prev.totalCollected,
            elapsedMs: event.elapsedMs ?? prev.elapsedMs,
            logs,
          };

        case "page_done":
          return {
            ...prev,
            currentPage: event.page,
            totalPages: event.totalPages,
            totalCollected: event.totalCollected,
            currentPageItems: event.pageItems,
            elapsedMs: event.elapsedMs,
            estimatedRemainingMs: event.estimatedRemainingMs,
            logs,
          };

        case "page_empty":
        case "page_error":
          return { ...prev, logs };

        case "saving":
          return { ...prev, phase: "saving", totalCollected: event.totalCollected ?? prev.totalCollected, logs };

        case "done":
          setLastSync("Just now");
          // Fetch updated stats after sync completes
          setTimeout(() => fetchStats(), 1000);
          return {
            ...prev,
            phase: "done",
            created: event.created,
            updated: event.updated,
            totalInDatabase: event.totalInDatabase,
            logs,
          };

        case "error":
          return { ...prev, phase: "error", errorMessage: event.message, logs };

        default:
          return { ...prev, logs };
      }
    });
  };

  // Progress bar percentage
  const progressPct =
    progress.phase === "saving"
      ? 95
      : progress.phase === "done"
      ? 100
      : progress.totalPages > 0
      ? Math.min(90, Math.round((progress.currentPage / progress.totalPages) * 90))
      : 0;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 italic tracking-tight">
            API <span className="text-orange-500">INTEGRATION</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
            Connect Adobe Stock via Apify
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Gateway Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* MAIN SYNC CARD */}
          <div className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-[0.03] text-orange-500 rotate-12">
              <Zap size={240} />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800">Manual Synchronization</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  Run the crawler bot to fetch the latest sales and asset performance data from Adobe Stock.
                  <span className="text-orange-500 font-bold"> (Cost per sync: $0.01)</span>
                </p>
              </div>

              {/* PROGRESS SECTION — hanya tampil saat syncing/saving/done/error */}
              {progress.phase !== "idle" && (
                <div className="space-y-4 pt-2">

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {progress.phase === "saving"
                          ? "Saving to database..."
                          : progress.phase === "done"
                          ? "Complete"
                          : progress.phase === "error"
                          ? "Error"
                          : `Page ${progress.currentPage}/${progress.totalPages}`}
                      </span>
                      <span className="text-[10px] font-black text-orange-500">{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${progressPct}%`,
                          background:
                            progress.phase === "error"
                              ? "#ef4444"
                              : progress.phase === "done"
                              ? "#22c55e"
                              : "#f97316",
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  {(isSyncing || progress.phase === "done") && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Collected</p>
                        <p className="text-lg font-black text-slate-800">{progress.totalCollected}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Plus size={8} /> New
                        </p>
                        <p className="text-lg font-black text-green-600">{progress.created}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Updated</p>
                        <p className="text-lg font-black text-orange-500">{progress.updated}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Est. Remaining</p>
                        <p className="text-lg font-black text-slate-800">
                          {progress.phase === "done"
                            ? "—"
                            : formatDuration(progress.estimatedRemainingMs)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {progress.phase === "error" && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-medium">{progress.errorMessage}</p>
                    </div>
                  )}

                  {/* Done message */}
                  {progress.phase === "done" && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      <p className="text-xs text-green-700 font-medium">
                        Synchronization complete! <span className="font-black">{progress.created} new</span> added,{" "}
                        <span className="font-black">{progress.updated} updated</span>. Total in database:{" "}
                        <span className="font-black">{progress.totalInDatabase}</span> assets.
                      </p>
                    </div>
                  )}

                  {/* Live log */}
                  {isSyncing && progress.logs.length > 0 && (
                    <div className="bg-slate-900 rounded-2xl p-4 space-y-1 font-mono">
                      {progress.logs.map((log, i) => (
                        <p
                          key={i}
                          className="text-[10px] text-slate-400 leading-relaxed"
                          style={{ opacity: 0.4 + (i / progress.logs.length) * 0.6 }}
                        >
                          <span className="text-orange-400">›</span> {log}
                        </p>
                      ))}
                      <p className="text-[10px] text-orange-400 animate-pulse">█</p>
                    </div>
                  )}
                </div>
              )}

              {/* BUTTON ROW */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 pt-2">
                {/* Search Query Input */}
                {progress.phase === "idle" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Search Filter (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave empty for all types, or type: nature, urban, business"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.trim())}
                      className="px-4 py-2.5 border border-slate-200 rounded-[16px] text-sm font-semibold text-slate-700 focus:outline-none focus:border-orange-400 transition"
                      disabled={isSyncing}
                    />
                    <span className="text-[8px] text-slate-400 font-medium">Empty = 1000 diverse items, or filter specific</span>
                  </div>
                )}

                {/* Sync Limit Input */}
                {progress.phase === "idle" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Items to Sync
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      step="10"
                      value={syncLimit}
                      onChange={(e) => setSyncLimit(Math.max(10, Math.min(1000, parseInt(e.target.value) || 1000)))}
                      className="px-4 py-2.5 border border-slate-200 rounded-[16px] text-sm font-semibold text-slate-700 focus:outline-none focus:border-orange-400 transition"
                      disabled={isSyncing}
                    />
                    <span className="text-[8px] text-slate-400 font-medium">Min: 10, Max: 1000</span>
                  </div>
                )}

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] font-black text-[12px] uppercase tracking-widest transition-all shadow-xl ${
                    isSyncing
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-orange-500 hover:scale-[1.02] active:scale-95 shadow-slate-200"
                  }`}
                >
                  <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>

                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                    Activity Status
                  </span>
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                    <Clock size={12} className="text-orange-500" /> {lastSync}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* API CONFIG */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              Configuration Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Apify Agent</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 font-mono">cOsM6h...SG1E</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Target Profile</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Adobe Contributor</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Database size={80} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
              Database Stats
            </h4>
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Stored Assets</span>
                <span className="text-2xl font-black italic">
                  {progress.phase === "done" && progress.totalInDatabase > 0
                    ? progress.totalInDatabase
                    : totalAssets > 0
                    ? totalAssets
                    : "--"}
                </span>
              </div>
              
              {/* Apify Usage */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Apify Usage</span>
                  <span className="text-xl font-black text-orange-400">
                    ${estimatedCost.toFixed(2)} / ${apifyUsage.limit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (estimatedCost / apifyUsage.limit) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {apifyUsage.limit > 0
                    ? `${Math.round((estimatedCost / apifyUsage.limit) * 100)}% of monthly budget`
                    : "Budget limit unknown"}
                </p>
              </div>

              {progress.phase === "syncing" && (
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Elapsed</span>
                  <span className="text-sm font-black text-slate-300">
                    {formatDuration(progress.elapsedMs)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-orange-50 border border-orange-100 rounded-[32px]">
            <div className="flex gap-4">
              <AlertCircle size={20} className="text-orange-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-orange-900">Information</p>
                <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                  Each synchronization will take around 1-2 minutes depending on the number of assets in your Adobe Stock portfolio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}