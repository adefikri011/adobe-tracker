"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ChartData {
  label: string;
  downloads: number;
}

type Mode = "daily" | "monthly";

export default function PerformanceChart() {
  const [mode, setMode] = useState<Mode>("daily");
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/dashboard/performance?mode=${mode}`);
        if (res.ok) {
          const result = await res.json();
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode]);

  if (loading) {
    return (
      <div>
        <div className="flex gap-1 mb-6 w-fit bg-orange-50 p-1 rounded-xl border border-orange-100">
          {(["daily", "monthly"] as Mode[]).map((m) => (
            <button
              key={m}
              disabled
              className="relative px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors opacity-50"
            >
              {m === "daily" ? "Daily" : "Monthly"}
            </button>
          ))}
        </div>
        <div className="h-52 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

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
          {data.length > 0 ? (
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
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400">
              No data available
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}