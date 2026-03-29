"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  TrendingUp, 
  Hash, 
  MousePointer2, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  ChevronRight
} from "lucide-react";

type KeywordData = {
  id: number;
  keyword: string;
  volume: number;
  growth: string;
  isUp: boolean;
  competition: "High" | "Medium" | "Low";
};

export default function KeywordsPage() {
  const [filter, setFilter] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");
  const [searchQuery, setSearchQuery] = useState("");

  const keywordsData: Record<string, KeywordData[]> = {
    Daily: [
      { id: 1, keyword: "Ramadan 2026", volume: 120, growth: "+45%", isUp: true, competition: "High" },
      { id: 2, keyword: "Iftar Party", volume: 85, growth: "+30%", isUp: true, competition: "Medium" },
    ],
    Weekly: [
      { id: 1, keyword: "Modern Mosque", volume: 850, growth: "+12%", isUp: true, competition: "High" },
      { id: 2, keyword: "Eid Mubarak Card", volume: 640, growth: "-5%", isUp: false, competition: "High" },
    ],
    Monthly: [
      { id: 1, keyword: "Minimalist Interior", volume: 12400, growth: "+15.3%", isUp: true, competition: "Medium" },
      { id: 2, keyword: "Tech Conference", volume: 8900, growth: "+8.2%", isUp: true, competition: "Low" },
      { id: 3, keyword: "Sustainability Icon", volume: 5600, growth: "-2.1%", isUp: false, competition: "Medium" },
      { id: 4, keyword: "AI Robot Hand", volume: 4200, growth: "+25.7%", isUp: true, competition: "High" },
      { id: 5, keyword: "Crypto Wallet App", volume: 3100, growth: "+1.2%", isUp: true, competition: "Medium" },
    ],
  };

  const filteredKeywords = useMemo(() => {
    return keywordsData[filter].filter(k => 
      k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filter, searchQuery]);

  return (
    <div className="p-6 md:p-10 bg-[#FBFCFE] min-h-screen space-y-10">
      
      {/* ── Header Section ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b] tracking-tight">Top Keywords</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Identify high-performing tags for your Adobe Stock assets.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all w-64 font-medium shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            {(["Daily", "Weekly", "Monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`px-5 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                  filter === p 
                  ? "bg-[#ff6b00] text-white shadow-md shadow-orange-100" 
                  : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Hot Keyword Card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100/50 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Hot Keyword</p>
              <h2 className="text-2xl font-semibold text-[#1e293b] mt-2"># {filteredKeywords[0]?.keyword || "N/A"}</h2>
            </div>
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-500 shadow-sm">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg text-green-600">
              <ArrowUpRight size={14} />
              <span className="text-[11px] font-bold">{filteredKeywords[0]?.growth}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">Growth this period</span>
          </div>
        </div>

        {/* Competition Card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100/50 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Avg. Competition</p>
              <h2 className="text-2xl font-semibold text-[#1e293b] mt-2 italic">Medium</h2>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 shadow-sm">
              <BarChart3 size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">Optimized for new uploads</p>
        </div>

        {/* Impressions Card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100/50 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Total Impressions</p>
              <h2 className="text-2xl font-semibold text-[#1e293b] mt-2">482.9K</h2>
            </div>
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-500 shadow-sm">
              <MousePointer2 size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-500">
             <ArrowUpRight size={14} />
             <span className="text-[11px] font-bold">+12.4% vs last {filter.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* ── Keywords Table ──────────────────────────────────────── */}
      <div className="bg-white rounded-[32px] border border-slate-100/50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1e293b]">Trending Tags</h3>
          <button className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-[#ff6b00] transition-all uppercase tracking-widest">
            <Download size={14} /> Export Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fcfdfe]">
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] pl-10 w-24">Rank</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Keyword</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Search Volume</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Monthly Trend</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredKeywords.map((kw, index) => (
                  <motion.tr 
                    key={kw.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/40 transition-all cursor-pointer"
                  >
                    <td className="p-5 pl-10 text-sm font-semibold text-slate-300 group-hover:text-orange-400 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#ff6b00] group-hover:text-white group-hover:border-[#ff6b00] transition-all">
                          <Hash size={14} />
                        </div>
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-[#1e293b]">{kw.keyword}</span>
                      </div>
                    </td>
                    <td className="p-5 text-sm font-semibold text-[#1e293b]">{kw.volume.toLocaleString()}</td>
                    <td className="p-5">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit border ${
                        kw.isUp ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {kw.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span className="text-[11px] font-bold">{kw.growth}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider border ${
                        kw.competition === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                        kw.competition === 'Medium' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {kw.competition}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}