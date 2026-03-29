"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ImageIcon, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreHorizontal,
  Download,
  Eye,
  DollarSign,
  Search
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", assets: 400 },
  { name: "Feb", assets: 700 },
  { name: "Mar", assets: 600 },
  { name: "Apr", assets: 900 },
  { name: "May", assets: 1200 },
  { name: "Jun", assets: 1100 },
  { name: "Jul", assets: 1500 },
];

const stats = [
  {
    label: "Total Assets",
    value: "1,284",
    change: "+12.5%",
    isUp: true,
    icon: ImageIcon,
    color: "bg-blue-50 text-blue-500",
  },
  {
    label: "Active Assets",
    value: "1,120",
    change: "+4.2%",
    isUp: true,
    icon: TrendingUp,
    color: "bg-green-50 text-green-500",
  },
  {
    label: "Pending Review",
    value: "164",
    change: "-2.4%",
    isUp: false,
    icon: Eye,
    color: "bg-orange-50 text-orange-500",
  },
  {
    label: "Avg. Earnings",
    value: "$42.10",
    change: "+1.2%",
    isUp: true,
    icon: DollarSign,
    color: "bg-purple-50 text-purple-500",
  },
];

const topAssets = [
  { id: 1, name: "Sunset Over Mountain", category: "Landscape", downloads: 420, revenue: "$120.50", status: "Active" },
  { id: 2, name: "Modern Office Interior", category: "Business", downloads: 312, revenue: "$89.20", status: "Active" },
  { id: 3, name: "Abstract Blue Fluid", category: "Abstract", downloads: 284, revenue: "$75.00", status: "Active" },
  { id: 4, name: "Healthy Food Flatlay", category: "Food", downloads: 156, revenue: "$42.15", status: "Pending" },
];

export default function AssetsPage() {
  return (
    <div className="p-6 md:p-10 bg-[#FBFCFE] min-h-screen space-y-10">
      
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b] tracking-tight">Assets Management</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Monitor and track your Adobe Stock asset performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all w-64 font-medium"
            />
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            {["Daily", "Monthly", "Yearly"].map((period) => (
              <button
                key={period}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  period === "Yearly" ? "bg-[#ff6b00] text-white shadow-md shadow-orange-100" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats Cards (Thin Style) ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-[24px] border border-slate-100/50 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-semibold text-[#1e293b] mt-1.5">{stat.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.color} bg-opacity-40`}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-1.5">
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg ${stat.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span className="text-[11px] font-bold">{stat.change}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium italic">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Asset Growth Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-slate-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-[#1e293b]">Asset Growth</h3>
            <button className="text-[#ff6b00] text-xs font-bold flex items-center gap-1.5 hover:gap-2 transition-all uppercase tracking-wider">
              Full Report <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ff6b00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="assets" 
                  stroke="#ff6b00" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorAssets)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing List */}
        <div className="bg-white p-8 rounded-[24px] border border-slate-100/50 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1e293b] mb-8">Top Performing</h3>
          <div className="space-y-6">
            {topAssets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-[#ff6b00] transition-colors border border-slate-100/50">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1e293b] group-hover:text-[#ff6b00] transition-colors line-clamp-1">{asset.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asset.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#1e293b]">{asset.downloads}</p>
                  <p className="text-[10px] text-green-500 font-bold uppercase">Sales</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 rounded-2xl bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors border border-slate-100/50">
            Show All Assets
          </button>
        </div>
      </div>

      {/* ── Asset Table (Refined) ───────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-100/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
          <h3 className="text-base font-semibold text-[#1e293b]">Recent Uploads</h3>
          <div className="flex gap-2">
             <button title="Export Data" className="p-2 text-slate-400 hover:text-[#ff6b00] transition-colors">
               <Download size={18} />
             </button>
             <button className="p-2 text-slate-400">
               <MoreHorizontal size={18} />
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfdfe]">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] pl-8">Asset Details</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Category</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Revenue</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Status</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="p-4 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-50/50 flex items-center justify-center text-orange-500 border border-orange-100/50">
                        <ImageIcon size={12} />
                      </div>
                      <span className="text-sm font-medium text-slate-600 group-hover:text-[#1e293b]">{asset.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate-400">{asset.category}</td>
                  <td className="p-4 text-sm font-semibold text-[#1e293b]">{asset.revenue}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                      asset.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="p-2 text-slate-300 hover:text-[#ff6b00] transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}