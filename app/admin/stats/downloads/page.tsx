"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileImage,
  Video,
  Music,
  Users,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// ─── MOCK DATA ───────────────────────────────────────────────────────
const kpiData = [
  {
    title: "Total Downloads",
    value: "142,058",
    change: "+12.5%",
    trend: "up",
    icon: Download,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    title: "This Month",
    value: "24,302",
    change: "+8.2%",
    trend: "up",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    title: "This Week",
    value: "5,204",
    change: "-2.4%",
    trend: "down",
    icon: TrendingDown,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    title: "Avg. Per Day",
    value: "810",
    change: "+1.2%",
    trend: "up",
    icon: Users,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
];

const chartData = [
  { name: "Jan", downloads: 4000, earnings: 2400 },
  { name: "Feb", downloads: 3000, earnings: 1398 },
  { name: "Mar", downloads: 2000, earnings: 9800 },
  { name: "Apr", downloads: 2780, earnings: 3908 },
  { name: "May", downloads: 1890, earnings: 4800 },
  { name: "Jun", downloads: 2390, earnings: 3800 },
  { name: "Jul", downloads: 3490, earnings: 4300 },
  { name: "Aug", downloads: 4000, earnings: 2400 },
  { name: "Sep", downloads: 3000, earnings: 1398 },
  { name: "Oct", downloads: 2780, earnings: 3908 },
  { name: "Nov", downloads: 1890, earnings: 4800 },
  { name: "Dec", downloads: 2390, earnings: 3800 },
];

const topAssets = [
  {
    id: 1,
    title: "Modern Business Team Meeting",
    type: "Video",
    downloads: 1240,
    revenue: "$3,100",
    thumbnail: "https://picsum.photos/seed/v1/100/100",
  },
  {
    id: 2,
    title: "Abstract Orange Gradient Background",
    type: "Image",
    downloads: 985,
    revenue: "$1,200",
    thumbnail: "https://picsum.photos/seed/i2/100/100",
  },
  {
    id: 3,
    title: "Upbeat Corporate Music",
    type: "Audio",
    downloads: 850,
    revenue: "$2,550",
    thumbnail: "https://picsum.photos/seed/a3/100/100",
  },
  {
    id: 4,
    title: "Cyberpunk City Night",
    type: "Image",
    downloads: 720,
    revenue: "$890",
    thumbnail: "https://picsum.photos/seed/i4/100/100",
  },
];

const recentActivity = [
  {
    user: "John Doe",
    email: "john@design.co",
    asset: "Modern Business Team Meeting",
    time: "2 mins ago",
    status: "Completed",
  },
  {
    user: "Sarah Smith",
    email: "sarah@studio.io",
    asset: "Abstract Orange Gradient",
    time: "15 mins ago",
    status: "Completed",
  },
  {
    user: "Mike Johnson",
    email: "mike@agency.net",
    asset: "Upbeat Corporate Music",
    time: "1 hour ago",
    status: "Completed",
  },
];

// ─── SUB COMPONENTS ───────────────────────────────────────────────────

const KPICard = ({ data }: { data: typeof kpiData[0] }) => {
  const Icon = data.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">{data.title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{data.value}</h3>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl ${data.bgColor}`}>
          <Icon size={18} className={data.color} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs sm:text-sm">
        <span
          className={`flex items-center font-semibold ${
            data.trend === "up" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {data.trend === "up" ? (
            <ArrowUpRight size={14} className="mr-1" />
          ) : (
            <ArrowDownRight size={14} className="mr-1" />
          )}
          {data.change}
        </span>
        <span className="text-slate-400 ml-2">vs last period</span>
      </div>
    </motion.div>
  );
};

const AssetTypeIcon = ({ type }: { type: string }) => {
  if (type === "Video") return <Video size={16} className="text-purple-500" />;
  if (type === "Audio") return <Music size={16} className="text-pink-500" />;
  return <FileImage size={16} className="text-blue-500" />;
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────

export default function DownloadsPage() {
  const [period, setPeriod] = useState<"Daily" | "Monthly" | "Yearly">("Monthly");

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-4 sm:p-6 md:p-8 overflow-y-auto">
      
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-8 gap-3 sm:gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Total Downloads
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Track asset performance and user downloads.
          </p>
        </div>

        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {["Daily", "Monthly", "Yearly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-3 sm:px-6 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                period === p
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        {kpiData.map((data, index) => (
          <KPICard key={index} data={data} />
        ))}
      </div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Performance Overview</h2>
          <button className="text-xs sm:text-sm text-orange-500 font-semibold hover:underline flex items-center justify-start">
            View Report <ArrowUpRight size={14} className="ml-1 flex-shrink-0" />
          </button>
        </div>
        <div className="w-full h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#334155', fontWeight: 600 }}
              />
              <Area 
                type="monotone" 
                dataKey="downloads" 
                stroke="#f97316" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorDownloads)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bottom Section: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Assets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] overflow-hidden"
        >
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Top Assets</h2>
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4 font-semibold">Asset</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Downloads</th>
                  <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topAssets.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.thumbnail} 
                          alt={item.title} 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-100" 
                        />
                        <span className="font-medium text-slate-900 text-sm group-hover:text-orange-500 transition-colors line-clamp-1">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium bg-slate-100 w-fit px-2 py-1 rounded-md">
                        <AssetTypeIcon type={item.type} />
                        {item.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {item.downloads.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                      {item.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Activity List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
        >
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
          <div className="p-2">
            {recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm border border-orange-100 shrink-0">
                  {activity.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {activity.user}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    downloaded <span className="text-orange-500 font-medium">{activity.asset}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-50">
            <button className="w-full py-2 text-xs font-bold text-slate-500 hover:text-orange-500 transition-colors">
              View All Activity
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}