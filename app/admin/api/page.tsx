"use client";

import React, { useState } from "react";
import { 
  RefreshCw, CheckCircle2, AlertCircle, 
  Database, Zap, Clock 
} from "lucide-react";

export default function ApiIntegrationPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("Not synced yet");

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const response = await fetch("/api/adobe/sync", {
        method: "POST",
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      console.log("[Sync Response]", data);

      if (response.ok && data.success) {
        setLastSync("Just now");
        
        const totalMsg = data.totalInDatabase ? ` (Total in database: ${data.totalInDatabase})` : "";
        const successMsg = data.skipped && data.skipped > 0 
          ? `✅ Success! ${data.count} new records updated.\n(${data.skipped} invalid items skipped)${totalMsg}`
          : `✅ Success! ${data.count} portfolio records have been updated.${totalMsg}`;
        
        alert(successMsg);
      } else {
        const errorMsg = data.error || "A server error occurred";
        alert(`❌ Failed: ${errorMsg}`);
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Make sure the server is running.";
      alert(`⚠️ Connection failed: ${errorMsg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 italic tracking-tight">API <span className="text-orange-500">INTEGRATION</span></h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Connect Adobe Stock via Apify</p>
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
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Manual Synchronization</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  Run the crawler bot to fetch the latest sales and asset performance data from Adobe Stock.
                  <span className="text-orange-500 font-bold"> (Estimated: Rp800/sync)</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] font-black text-[12px] uppercase tracking-widest transition-all shadow-xl ${
                    isSyncing 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-slate-900 text-white hover:bg-orange-500 hover:scale-[1.02] active:scale-95 shadow-slate-200"
                  }`}
                >
                  <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
                
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Activity Status</span>
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                    <Clock size={12} className="text-orange-500"/> {lastSync}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* API CONFIG */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Configuration Status</h3>
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

        {/* SIDEBAR STATS */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Database size={80} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Database Stats</h4>
            
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Stored Assets</span>
                <span className="text-2xl font-black italic italic">--</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Last Est. Cost</span>
                <span className="text-xl font-black text-orange-400">$0.04</span>
              </div>
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