"use client";

import { motion } from "framer-motion";
import { LayoutList } from "lucide-react";

const breakdown = [
  { source: "Photo Sales",    amount: 6840,  pct: 55, color: "bg-orange-400" },
  { source: "Vector Sales",   amount: 3120,  pct: 25, color: "bg-blue-400"   },
  { source: "Video Sales",    amount: 1740,  pct: 14, color: "bg-emerald-400"},
  { source: "Subscription",   amount: 780,   pct: 6,  color: "bg-amber-400"  },
];

const total = breakdown.reduce((s, b) => s + b.amount, 0);

export default function EarningBreakdown() {
  return (
    <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <LayoutList size={15} className="text-orange-400" />
        <h2 className="text-sm font-bold text-slate-800">Earning Breakdown</h2>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden mb-6 gap-0.5">
        {breakdown.map((b) => (
          <motion.div
            key={b.source}
            initial={{ width: 0 }}
            animate={{ width: `${b.pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className={`h-full ${b.color} rounded-full`}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-4">
        {breakdown.map((b, i) => (
          <motion.div
            key={b.source}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${b.color}`} />
            <span className="text-sm text-slate-600 flex-1">{b.source}</span>
            <span className="text-xs text-slate-400 font-medium">{b.pct}%</span>
            <span className="text-sm font-bold text-slate-700 w-20 text-right">
              ${b.amount.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Total row */}
      <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
        <span className="text-lg font-bold text-slate-900">${total.toLocaleString()}</span>
      </div>
    </div>
  );
}