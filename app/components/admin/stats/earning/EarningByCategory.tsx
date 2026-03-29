"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

const categories = [
  { name: "Technology",  value: 3200, color: "#f97316" },
  { name: "Nature",      value: 2400, color: "#3b82f6" },
  { name: "Business",    value: 1900, color: "#10b981" },
  { name: "Health",      value: 1400, color: "#f59e0b" },
  { name: "Abstract",    value: 980,  color: "#8b5cf6" },
  { name: "Other",       value: 600,  color: "#94a3b8" },
];

const total = categories.reduce((s, c) => s + c.value, 0);

export default function EarningByCategory() {
  return (
    <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <PieIcon size={15} className="text-blue-400" />
        <h2 className="text-sm font-bold text-slate-800">Earning by Category</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut chart */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={66}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {categories.map((c, i) => (
                  <Cell key={c.name} fill={c.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #fed7aa",
                  borderRadius: "10px",
                  fontSize: "11px",
                  boxShadow: "0 4px 16px rgba(249,115,22,0.12)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 font-medium">Total</span>
            <span className="text-sm font-bold text-slate-800">${(total / 1000).toFixed(1)}k</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {categories.map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <span className="text-xs text-slate-500 flex-1">{c.name}</span>
              <span className="text-xs font-bold text-slate-700">${c.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}