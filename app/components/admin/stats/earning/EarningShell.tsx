"use client";

import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown,
  Clock, ArrowUpRight, ArrowDownRight, Timer,
} from "lucide-react";

interface SummaryCard {
  key:    string;
  label:  string;
  value:  string;
  change: string;
  up:     boolean | null;
  sub:    string;
}

interface Props {
  summaryCards: SummaryCard[];
  children:     React.ReactNode;
}

const ICON_MAP: Record<string, React.ElementType> = {
  total:   DollarSign,
  monthly: TrendingUp,
  weekly:  TrendingDown,
  pending: Timer,
};

const COLOR_MAP: Record<string, { iconBg: string; iconColor: string; valueColor: string; accent: string }> = {
  total:   { iconBg: "bg-emerald-50", iconColor: "text-emerald-500", valueColor: "text-emerald-600", accent: "from-emerald-400 to-emerald-500" },
  monthly: { iconBg: "bg-orange-50",  iconColor: "text-orange-500",  valueColor: "text-orange-500",  accent: "from-orange-400 to-orange-500"  },
  weekly:  { iconBg: "bg-blue-50",    iconColor: "text-blue-500",    valueColor: "text-blue-600",    accent: "from-blue-400 to-blue-500"      },
  pending: { iconBg: "bg-amber-50",   iconColor: "text-amber-500",   valueColor: "text-amber-600",   accent: "from-amber-400 to-amber-500"    },
};

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function EarningShell({ summaryCards, children }: Props) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-6"
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Total Earnings
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Track your Adobe Stock revenue performance
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 bg-white border border-orange-100 rounded-xl text-xs text-slate-400 shadow-sm">
          <Clock size={12} />
          Last updated: just now
        </div>
      </motion.div>

      {/* ── Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon   = ICON_MAP[card.key] ?? DollarSign;
          const colors = COLOR_MAP[card.key] ?? COLOR_MAP.total;

          return (
            <motion.div
              key={card.key}
              variants={fadeUp}
              whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(249,115,22,0.10)" }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm p-5 cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                  <Icon size={18} className={colors.iconColor} />
                </div>
                {card.up !== null && (
                  <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${card.up ? "text-emerald-500" : "text-red-400"}`}>
                    {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {card.change}
                  </span>
                )}
              </div>

              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {card.label}
              </p>
              <p className={`text-3xl font-bold ${colors.valueColor} leading-none tracking-tight`}>
                {card.value}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {card.up === null ? card.change : card.sub}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Rest of page ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="space-y-5">
        {children}
      </motion.div>
    </motion.div>
  );
}