"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const dailyData = [
  { label: "Mon", downloads: 180 },
  { label: "Tue", downloads: 240 },
  { label: "Wed", downloads: 195 },
  { label: "Thu", downloads: 310 },
  { label: "Fri", downloads: 275 },
  { label: "Sat", downloads: 420 },
  { label: "Sun", downloads: 390 },
];

const monthlyData = [
  { label: "Jan", downloads: 3200 },
  { label: "Feb", downloads: 2800 },
  { label: "Mar", downloads: 3900 },
  { label: "Apr", downloads: 4100 },
  { label: "May", downloads: 3600 },
  { label: "Jun", downloads: 4800 },
  { label: "Jul", downloads: 5200 },
  { label: "Aug", downloads: 4700 },
  { label: "Sep", downloads: 5600 },
  { label: "Oct", downloads: 6100 },
  { label: "Nov", downloads: 5800 },
  { label: "Dec", downloads: 6800 },
];

type Mode = "daily" | "monthly";

export default function PerformanceChart() {
  const [mode, setMode] = useState<Mode>("daily");
  const data = mode === "daily" ? dailyData : monthlyData;

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 mb-6 w-fit bg-orange-50 p-1 rounded-xl border border-orange-100">
        {(["daily", "monthly"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="relative px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            {mode === m && (
              <motion.div
                layoutId="chartToggle"
                className="absolute inset-0 bg-orange-500 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className={`relative z-10 transition-colors ${mode === m ? "text-white" : "text-orange-400"}`}>
              {m === "daily" ? "Daily" : "Monthly"}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}    />
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
                itemStyle={{ color: "#f97316", fontWeight: 600 }}
                cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "4 2" }}
              />
              <Area
                type="monotone"
                dataKey="downloads"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#grad)"
                dot={false}
                activeDot={{ r: 5, fill: "#f97316", stroke: "#fff", strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}