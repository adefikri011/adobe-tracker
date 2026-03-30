"use client";

import React, { useState } from "react";
import { 
  Plug, RefreshCw, CheckCircle2, AlertCircle, 
  Database, Zap, Clock, ExternalLink 
} from "lucide-react";
import { motion } from "framer-motion";

export default function ApiIntegrationPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("2 hours ago");

  // Fungsi simulasi narik data (Trigger Apify Actor)
  const handleSync = () => {
    setIsSyncing(true);
    // Di sini nanti panggil API Route Next.js kamu yang nembak ke Apify
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync("Just now");
    }, 5000); 
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      
      {/* ── Header Area ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 italic">API Integration</h1>
          <p className="text-sm text-slate-400 font-medium">Connect and sync your Adobe Stock data via Apify.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left: Main Action Card (Narik Data) ────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-orange-100 rounded-[40px] p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap size={120} className="text-orange-500" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Manual Synchronization</h3>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed max-w-md">
                Trigger the robot to fetch the latest sales, earnings, and asset performance from your Adobe Stock account. 
                <span className="text-orange-500 font-bold"> (Cost: ~Rp800/sync)</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-3xl font-black text-sm transition-all shadow-xl ${
                    isSyncing 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-[#ff6b00] text-white shadow-orange-200 hover:scale-[1.03] active:scale-95"
                  }`}
                >
                  <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "FETCHING DATA..." : "SYNC NOW"}
                </button>
                
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Last Activity</span>
                  <span className="text-sm font-bold text-slate-600">{lastSync}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Table (API Credentials) */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">API Configuration</h3>
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 ml-2">Apify Token</label>
                   <input type="password" value="************************" readOnly className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 ml-2">Actor ID (louisdeconinck)</label>
                   <input type="text" value="louisdeconinck/adobe-stock-scraper" readOnly className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono text-slate-400" />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* ── Right: Stats & Info ────────────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-[#1e293b] rounded-[32px] p-8 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-xl text-orange-400">
                <Database size={20} />
              </div>
              <h4 className="font-bold">Sync Stats</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Syncs (Monthly)</span>
                <span className="text-xl font-black">124</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Cost</span>
                <span className="text-xl font-black text-orange-400">$1.24</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-orange-400" />
                <span className="text-[10px] font-bold uppercase">Auto-Sync Schedule</span>
              </div>
              <p className="text-xs font-bold text-slate-300">Every 6 Hours (00:00, 06:00, 12:00, 18:00)</p>
            </div>
          </div>

          <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
            <div className="flex gap-3">
              <AlertCircle size={18} className="text-blue-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-blue-900">How it works?</p>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  Clicking "Sync Now" will trigger the Apify Actor. Data will be saved to your Supabase DB instantly once the process is complete.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}