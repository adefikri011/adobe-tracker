"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, CheckCircle2, AlertCircle,
  Database, Zap, Clock, Layers, TrendingUp, Plus, ArrowRight
} from "lucide-react";

type SyncPhase = "idle" | "syncing" | "saving" | "done" | "error";
type SyncMode = "all" | "custom";

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
  const [syncMode, setSyncMode] = useState<SyncMode>("all");
  const [syncLimit, setSyncLimit] = useState(1000);
  const [searchQuery, setSearchQuery] = useState("");
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
  const router = useRouter();
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // Auto-refresh after sync completes
  useEffect(() => {
    if (progress.phase === "done") {
      setShowSuccessModal(true);
      setRedirectCountdown(5);
      
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Reset ke halaman awal
            window.location.href = "/admin/api";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [progress.phase]);

  const isSyncing = progress.phase === "syncing" || progress.phase === "saving";

  const handleSync = async () => {
    if (isSyncing) return;

    abortRef.current = new AbortController();

    // Determine queries based on mode
    let queriesToSync: string[] = [];
    
    if (syncMode === "all") {
      // Sync all - gunakan diverse queries otomatis
      queriesToSync = [
        "nature", "landscape", "technology", "business", 
        "person", "portrait", "food", "travel"
      ];
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
        logs: [`Starting sync for ALL diverse topics (${queriesToSync.length} queries)...`, ...queriesToSync.map(q => `  • ${q}`)],
      });
    } else {
      // Custom queries
      queriesToSync = searchQuery
        .split(',')
        .map(q => q.trim())
        .filter(q => q.length > 0);
      
      if (queriesToSync.length === 0) {
        alert("Please enter at least one query or select 'Sync All'");
        return;
      }

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
        logs: [`Starting sync for ${queriesToSync.length} custom query/queries...`, ...queriesToSync.map(q => `  • ${q}`)],
      });
    }

    let totalCreatedAll = 0;
    let totalInDatabaseAll = 0;

    for (let queryIndex = 0; queryIndex < queriesToSync.length; queryIndex++) {
      const currentQuery = queriesToSync[queryIndex];
      
      setProgress(prev => ({
        ...prev,
        logs: [...prev.logs, queryIndex > 0 ? `\n[${queryIndex + 1}/${queriesToSync.length}] Syncing: "${currentQuery}"` : `[${queryIndex + 1}/${queriesToSync.length}] Syncing: "${currentQuery}"`]
      }));

      try {
        const response = await fetch(`/api/adobe/sync?limit=${syncLimit}&query=${encodeURIComponent(currentQuery)}`, {
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
              
              // Accumulate created from all queries
              if (event.type === "done") {
                event.queryIndex = queryIndex;
                event.totalQueries = queriesToSync.length;
                totalCreatedAll += event.created || 0;
                totalInDatabaseAll = event.totalInDatabase || 0;
              }
              
              handleSSEEvent(event);
            } catch {}
          }
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setProgress((prev) => ({
          ...prev,
          phase: "error",
          errorMessage: `Query "${currentQuery}": ${e?.message || "Connection failed"}`,
        }));
        // Continue to next query even if one fails
        continue;
      }
    }

    // Final done event after all queries
    if (queriesToSync.length > 0) {
      setLastSync("Just now");
      setTimeout(() => fetchStats(), 1000);
      setProgress((prev) => ({
        ...prev,
        phase: "done",
        created: totalCreatedAll,
        totalInDatabase: totalInDatabaseAll,
        logs: [...prev.logs, `\n✅ All ${queriesToSync.length} queries completed!`, `Total new assets: ${totalCreatedAll}`],
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
          // Don't call fetchStats here - will be called after all queries done
          // Just update progress with this query's results
          return {
            ...prev,
            created: (prev.created || 0) + (event.created || 0),
            updated: (prev.updated || 0) + (event.updated || 0),
            totalInDatabase: event.totalInDatabase,
            logs: [...logs, `✓ Query completed: +${event.created} new assets`],
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">
              API <span className="text-orange-500">INTEGRATION</span>
            </h1>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full">⚡ SYNC</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Connect & Synchronize Adobe Stock Assets via Apify Crawler
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">✓ Gateway Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* MAIN SYNC CARD */}
          <div className="bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden">
            <div className="absolute -top-16 -right-16 opacity-[0.02] text-orange-500 rotate-12">
              <Zap size={300} />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Manual Synchronization</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl font-medium">
                  Run the crawler bot to fetch the latest sales and asset performance data from Adobe Stock. Each sync includes realistic download counts and revenue estimates.
                  <span className="text-orange-600 font-bold"> (Cost per sync: $0.01)</span>
                </p>
              </div>

              {/* PROGRESS SECTION — hanya tampil saat syncing/saving/done/error */}
              {progress.phase !== "idle" && (
                <div className="space-y-5 pt-4 pb-2">

                  {/* Progress bar dengan label yang lebih rapi */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {progress.phase === "saving"
                            ? "Saving to database..."
                            : progress.phase === "done"
                            ? "Synchronization Complete"
                            : progress.phase === "error"
                            ? "Sync Failed"
                            : `Syncing — Page ${progress.currentPage}/${progress.totalPages}`}
                        </p>
                      </div>
                      <span className="text-[11px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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

                  {/* Stats row — lebih rapi dan besar */}
                  {(isSyncing || progress.phase === "done") && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-150 hover:border-slate-200 transition">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1.5 tracking-wider">📊 Collected</p>
                        <p className="text-2xl font-black text-slate-800">{progress.totalCollected.toLocaleString()}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-150 hover:border-green-200 transition">
                        <p className="text-[8px] font-black text-green-600 uppercase mb-1.5 tracking-wider">✨ New</p>
                        <p className="text-2xl font-black text-green-600">{progress.created.toLocaleString()}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-150 hover:border-orange-200 transition">
                        <p className="text-[8px] font-black text-orange-600 uppercase mb-1.5 tracking-wider">🔄 Updated</p>
                        <p className="text-2xl font-black text-orange-600">{progress.updated.toLocaleString()}</p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-150 hover:border-indigo-200 transition">
                        <p className="text-[8px] font-black text-indigo-600 uppercase mb-1.5 tracking-wider">⏱️ Remaining</p>
                        <p className="text-2xl font-black text-indigo-600">
                          {progress.phase === "done"
                            ? "✓"
                            : formatDuration(progress.estimatedRemainingMs)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error message — lebih prominent */}
                  {progress.phase === "error" && (
                    <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in">
                      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-900">Sync Failed</p>
                        <p className="text-xs text-red-700 leading-relaxed mt-1">{progress.errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Done message */}
                  {progress.phase === "done" && (
                    <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-2xl animate-in fade-in">
                      <CheckCircle2 size={18} className="text-green-600 shrink-0 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-green-900">Sync Successful!</p>
                        <p className="text-xs text-green-700 leading-relaxed mt-0.5">
                          <span className="font-black">{progress.created}</span> new assets added, 
                          <span className="font-black ml-1">{progress.updated}</span> updated. 
                          Total: <span className="font-black ml-1">{progress.totalInDatabase.toLocaleString()}</span> assets.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Live log — compact dan modern */}
                  {isSyncing && progress.logs.length > 0 && (
                    <div className="bg-slate-900 rounded-2xl p-4 space-y-1.5 font-mono max-h-40 overflow-y-auto">
                      {progress.logs.slice(-8).map((log, i) => (
                        <p
                          key={i}
                          className="text-[10px] text-slate-300 leading-relaxed"
                          style={{ opacity: 0.3 + (i / progress.logs.length) * 0.7 }}
                        >
                          <span className="text-orange-400 mr-2">▸</span> {log}
                        </p>
                      ))}
                      <p className="text-[10px] text-orange-400 animate-pulse">●</p>
                    </div>
                  )}
                </div>
              )}

              {/* BUTTON ROW */}
              <div className="flex flex-col gap-4 pt-4">
                
                {/* Mode & Query Section - lebih rapi */}
                {progress.phase === "idle" && (
                  <div className="space-y-4 pb-2 border-t border-slate-100 pt-4">
                    {/* Sync Mode Toggle - full width dan lebih besar */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                        📋 Sync Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSyncMode("all")}
                          className={`py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                            syncMode === "all"
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200 scale-[1.02]"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                          }`}
                        >
                          🌐 Sync All
                        </button>
                        <button
                          onClick={() => setSyncMode("custom")}
                          className={`py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                            syncMode === "custom"
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200 scale-[1.02]"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                          }`}
                        >
                          ⚙️ Custom
                        </button>
                      </div>
                    </div>

                    {/* Search Query Input - tampil dengan better styling */}
                    {syncMode === "custom" && (
                      <div className="flex flex-col gap-2 pt-2 pb-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          🔍 Search Queries
                        </label>
                        <input
                          type="text"
                          placeholder="nature, business, technology, travel..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="px-4 py-3 border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                          disabled={isSyncing}
                        />
                      </div>
                    )}

                    {/* Sync Limit Input - lebih rapi */}
                    <div className="flex flex-col gap-2 pt-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        📦 Items to Sync
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        step="10"
                        value={syncLimit}
                        onChange={(e) => setSyncLimit(Math.max(10, Math.min(1000, parseInt(e.target.value) || 1000)))}
                        className="px-4 py-3 border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                        disabled={isSyncing}
                      />
                    </div>
                  </div>
                )}

                {/* Info & Button Section - lebih besar dan prominent */}
                <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-2">
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all shadow-xl whitespace-nowrap ${
                      isSyncing
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        : "bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-orange-600 hover:to-orange-500 hover:shadow-orange-200 hover:scale-[1.02] active:scale-95 shadow-slate-300"
                    }`}
                  >
                    <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? "Syncing..." : "Start Sync"}
                  </button>

                  <div className="flex flex-col items-center sm:items-start justify-center flex-1 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl px-4 py-3 border border-slate-200">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      ⏰ Last Activity
                    </span>
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Clock size={14} className="text-orange-500" /> {lastSync}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API CONFIG */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Layers size={14} /> Configuration Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-3">🤖 Apify Agent</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">cOsM6h...SG1E</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg">
                    <CheckCircle2 size={12} className="text-green-600" />
                    <span className="text-[9px] font-bold text-green-700">Active</span>
                  </div>
                </div>
              </div>
              <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-3">📁 Target Database</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Adobe Assets</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg">
                    <CheckCircle2 size={12} className="text-green-600" />
                    <span className="text-[9px] font-bold text-green-700">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* Database Stats - lebih modern */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-700">
            <div className="absolute top-4 right-4 opacity-5">
              <Database size={100} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 relative z-10">
              📊 Database Stats
            </h4>
            <div className="space-y-6 relative z-10">
              {/* Total Assets */}
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Total Assets</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black italic">
                    {progress.phase === "done" && progress.totalInDatabase > 0
                      ? progress.totalInDatabase.toLocaleString()
                      : totalAssets > 0
                      ? totalAssets.toLocaleString()
                      : "—"}
                  </span>
                  <span className="text-slate-400 text-sm">items</span>
                </div>
              </div>
              
              {/* Apify Usage - dengan progress bar yang lebih detail */}
              <div className="space-y-3 border-t border-slate-700 pt-6">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Apify Budget</span>
                  <span className="text-lg font-black text-orange-400">
                    ${estimatedCost.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (estimatedCost / apifyUsage.limit) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-400">
                      {apifyUsage.limit > 0
                        ? `${Math.round((estimatedCost / apifyUsage.limit) * 100)}% of $${apifyUsage.limit.toFixed(2)}`
                        : "Budget unknown"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      ${(apifyUsage.limit - estimatedCost).toFixed(2)} left
                    </p>
                  </div>
                </div>
              </div>

              {/* Elapsed time saat syncing */}
              {progress.phase === "syncing" && (
                <div className="border-t border-slate-700 pt-3 mt-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Elapsed Time</span>
                    <span className="text-lg font-black text-slate-300 font-mono">
                      {formatDuration(progress.elapsedMs)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info box */}
          <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 rounded-[32px] shadow-sm">
            <div className="flex gap-4">
              <div className="flex-shrink-0 pt-0.5">
                <AlertCircle size={20} className="text-orange-600" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-orange-900">💡 Pro Tips</p>
                <ul className="text-[10px] text-orange-800 leading-relaxed space-y-1 font-medium">
                  <li>• Sync takes ~1-2 min depending on items count</li>
                  <li>• Sync All uses diverse topics for better coverage</li>
                  <li>• Each item has realistic download data</li>
                  <li>• Page will auto-refresh after completion</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL — Tampil setelah sync selesai */}
      {showSuccessModal && progress.phase === "done" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in fade-in scale-95 slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-4">
              {/* Success Icon */}
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-4">
                    <CheckCircle2 size={40} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-black text-slate-900">Sync Complete!</h2>
                <p className="text-sm text-slate-500 mt-1">Your assets have been successfully synchronized</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">New</p>
                  <p className="text-xl font-black text-green-600">{progress.created}</p>
                </div>
                <div className="text-center border-l border-r border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Updated</p>
                  <p className="text-xl font-black text-orange-500">{progress.updated}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
                  <p className="text-xl font-black text-slate-800">{progress.totalInDatabase}</p>
                </div>
              </div>

              {/* Auto-redirect countdown */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <Clock size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500">
                  Redirecting in <span className="font-bold text-slate-700">{redirectCountdown}s</span>
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={() => window.location.href = "/admin/api"}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
              >
                Go to Dashboard
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}