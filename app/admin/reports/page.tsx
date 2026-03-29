"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  TrendingUp, 
  DollarSign, 
  Image as ImageIcon,
  ChevronRight,
  Filter,
  PieChart
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

const monthlyData = [
  { name: "Jan", revenue: 2400 },
  { name: "Feb", revenue: 1398 },
  { name: "Mar", revenue: 9800 },
  { name: "Apr", revenue: 3908 },
  { name: "May", revenue: 4800 },
  { name: "Jun", revenue: 3800 },
  { name: "Jul", revenue: 6300 },
];

const reportList = [
  { id: "REP-001", name: "Monthly Earning Report", date: "Mar 01, 2026", size: "1.2 MB", type: "PDF" },
  { id: "REP-002", name: "Asset Performance Audit", date: "Feb 28, 2026", size: "840 KB", type: "CSV" },
  { id: "REP-003", name: "Keyword Competition Analytics", date: "Feb 15, 2026", size: "2.4 MB", type: "PDF" },
  { id: "REP-004", name: "User Subscription Growth", date: "Jan 30, 2026", size: "1.1 MB", type: "XLS" },
];

export default function ReportsPage() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="p-6 md:p-10 bg-[#FBFCFE] min-h-screen space-y-10">
      
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b] tracking-tight">Financial Reports</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Deep dive into your Adobe Stock earnings and performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:text-[#ff6b00] hover:border-orange-100 transition-all shadow-sm group">
            <Calendar size={14} className="group-hover:rotate-12 transition-transform" />
            <span>Select Range</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1e293b] text-white rounded-xl text-xs font-bold hover:bg-[#ff6b00] transition-all shadow-md shadow-slate-200">
            <Download size={14} />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {/* ── Visual Analytics ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-slate-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-lg font-semibold text-[#1e293b]">Revenue Analytics</h3>
            </div>
            <div className="flex items-center gap-1.5 text-green-500 bg-green-50 px-3 py-1 rounded-lg">
              <ArrowUpRight size={14} />
              <span className="text-[11px] font-bold">+18.4%</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[6, 6, 0, 0]} 
                  onMouseEnter={(_, index) => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={hoveredBar === index ? '#ff6b00' : '#f1f5f9'} 
                      className="transition-all duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-6">
          {[
            { label: "Total Revenue", value: "$12,840.00", icon: DollarSign, color: "text-green-500", bg: "bg-green-50" },
            { label: "Assets Sold", value: "842 Items", icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Avg. Commission", value: "33%", icon: PieChart, color: "text-purple-500", bg: "bg-purple-50" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ x: 5 }}
              className="bg-white p-6 rounded-[24px] border border-slate-100/50 shadow-sm flex items-center gap-5 group cursor-default transition-colors hover:border-orange-100"
            >
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-xl font-semibold text-[#1e293b] mt-0.5">{stat.value}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Generated Reports Table ─────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-100/50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-white flex justify-between items-center">
          <h3 className="text-base font-semibold text-[#1e293b]">Recent Downloads</h3>
          <button className="text-[10px] font-bold text-slate-400 hover:text-[#ff6b00] uppercase tracking-widest transition-colors">
            View Archive
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fcfdfe]">
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] pl-10">Report Name</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Date Generated</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">File Size</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">Format</th>
                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right pr-10">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportList.map((report) => (
                <tr key={report.id} className="group hover:bg-slate-50/40 transition-colors cursor-pointer">
                  <td className="p-5 pl-10">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-[#ff6b00] transition-colors border border-slate-100/50">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1e293b] group-hover:text-[#ff6b00] transition-colors">{report.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{report.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-xs font-medium text-slate-500">{report.date}</td>
                  <td className="p-5 text-xs font-medium text-slate-500">{report.size}</td>
                  <td className="p-5 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest border border-slate-200/50">
                      {report.type}
                    </span>
                  </td>
                  <td className="p-5 text-right pr-10">
                    <button className="p-2 text-slate-300 hover:text-[#ff6b00] hover:bg-orange-50 rounded-lg transition-all group/btn">
                      <Download size={16} className="group-hover/btn:-translate-y-0.5 transition-transform" />
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