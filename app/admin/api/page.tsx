"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plug, 
  Key, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck,
  Zap,
  Clock
} from "lucide-react";

export default function ApiIntegrationPage() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 bg-[#FBFCFE] min-h-screen">
      {/* ── Header Section (Clean & Light) ────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b] tracking-tight">API Integration</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Hubungkan website dengan Adobe Stock Developers API.</p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-bold text-green-600 uppercase tracking-wider">Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── API Form (Sesuaikan dengan Card di Foto) ───────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-100/50 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
                <Key size={18} />
              </div>
              <h3 className="text-lg font-semibold text-[#1e293b]">Adobe Developer Credentials</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Key (Client ID)</label>
                <input 
                  type="password" 
                  defaultValue="adobe_stock_live_8392xxxxxxxx"
                  className="w-full px-5 py-3 bg-[#f8fafc] border border-slate-100 rounded-2xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Secret</label>
                <input 
                  type="password" 
                  placeholder="Masukkan API Secret..." 
                  className="w-full px-5 py-3 bg-[#f8fafc] border border-slate-100 rounded-2xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <button className="flex-1 bg-[#ff6b00] text-white font-semibold py-3.5 rounded-2xl shadow-md shadow-orange-100 hover:bg-[#e66000] transition-all active:scale-[0.98] text-sm">
                Save Configuration
              </button>
              <button className="px-6 py-3.5 bg-slate-50 text-slate-400 font-semibold rounded-2xl hover:bg-slate-100 transition-all text-sm border border-slate-100">
                Reset
              </button>
            </div>
          </div>

          {/* ── Sync Section ─────────────────────────────────────── */}
          <div className="bg-white rounded-[24px] border border-slate-100/50 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                  <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1e293b]">Data Synchronization</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Terakhir update: 5 menit yang lalu</p>
                </div>
              </div>
              <button 
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1e293b] text-white rounded-2xl font-semibold text-xs hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {isSyncing ? "Syncing..." : "Refresh Data"}
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar (Clean Sidebar) ────────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-[#1e293b] rounded-[24px] p-8 text-white relative overflow-hidden">
             <div className="relative z-10">
               <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                 <Zap size={20} fill="currentColor" />
               </div>
               <h4 className="text-lg font-semibold mb-2 tracking-tight">Auto-Sync Active</h4>
               <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                 Sistem sinkronisasi otomatis berjalan setiap 6 jam untuk memperbarui data aset.
               </p>
               <div className="flex items-center gap-2 text-[11px] font-bold bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                 <Clock size={14} className="text-orange-400" />
                 Next: 22:00 WIB
               </div>
             </div>
             {/* Subtle Graphic */}
             <div className="absolute -right-6 -bottom-6 text-white opacity-[0.03]">
               <ShieldCheck size={180} />
             </div>
          </div>

          <div className="bg-[#fff7ed] rounded-[24px] p-8 border border-orange-100/50">
             <h4 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-3">Help Center</h4>
             <p className="text-xs text-orange-900/60 font-medium leading-relaxed mb-5">
               Gunakan Client ID dari portal Adobe Developer untuk memulai.
             </p>
             <a href="#" className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:gap-2 transition-all">
               Portal Adobe <ExternalLink size={12} />
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}