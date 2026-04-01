"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

type Period = "daily" | "monthly" | "yearly";

const DATA: Record<Period, { label: string; earning: number; payout: number }[]> = {
  daily: [
    { label: "Mon", earning: 180,  payout: 120 },
    { label: "Tue", earning: 340,  payout: 200 },
    { label: "Wed", earning: 220,  payout: 160 },
    { label: "Thu", earning: 480,  payout: 300 },
    { label: "Fri", earning: 390,  payout: 280 },
    { label: "Sat", earning: 560,  payout: 410 },
    { label: "Sun", earning: 430,  payout: 320 },
  ],
  monthly: [
    { label: "Jan", earning: 3200,  payout: 2400 },
    { label: "Feb", earning: 2800,  payout: 2100 },
    { label: "Mar", earning: 3900,  payout: 2900 },
    { label: "Apr", earning: 4100,  payout: 3200 },
    { label: "May", earning: 3600,  payout: 2700 },
    { label: "Jun", earning: 4800,  payout: 3800 },
    { label: "Jul", earning: 5200,  payout: 4100 },
    { label: "Aug", earning: 4700,  payout: 3600 },
    { label: "Sep", earning: 5600,  payout: 4400 },
    { label: "Oct", earning: 6100,  payout: 4900 },
    { label: "Nov", earning: 5800,  payout: 4600 },
    { label: "Dec", earning: 6800,  payout: 5400 },
  ],
  yearly: [
    { label: "2021", earning: 28000, payout: 21000 },
    { label: "2022", earning: 41000, payout: 32000 },
    { label: "2023", earning: 56000, payout: 44000 },
    { label: "2024", earning: 72000, payout: 58000 },
    { label: "2025", earning: 91000, payout: 74000 },
  ],
};

const PERIODS: Period[] = ["daily", "monthly", "yearly"];

export default function EarningChart() {
  const [period, setPeriod] = useState<Period>("monthly");
  const data = DATA[period];

  return (
    <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-4 sm:p-5 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-orange-400 flex-shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-slate-800">Earnings Overview</h2>
            <p className="text-xs text-slate-400">Revenue vs Payout comparison</p>
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 bg-orange-50 border border-orange-100 p-1 rounded-xl">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className="relative px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors">
              {period === p && (
                <motion.div
                  layoutId="earningPeriod"
                  className="absolute inset-0 bg-orange-500 rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`relative z-10 ${period === p ? "text-white" : "text-orange-400"}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradEarning" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradPayout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #fed7aa",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "#1e293b",
                  boxShadow: "0 4px 16px rgba(249,115,22,0.12)",
                  padding: "8px 14px",
                }}
                cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "4 2" }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "12px" }}
              />
              <Area type="monotone" dataKey="earning" name="Earning" stroke="#f97316" strokeWidth={2.5} fill="url(#gradEarning)" dot={false} activeDot={{ r: 5, fill: "#f97316", stroke: "#fff", strokeWidth: 2.5 }} />
              <Area type="monotone" dataKey="payout"  name="Payout"  stroke="#3b82f6" strokeWidth={2}   fill="url(#gradPayout)"  dot={false} activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2.5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}