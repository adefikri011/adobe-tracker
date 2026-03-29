"use client";

import { motion } from "framer-motion";
import {
  DollarSign, Download, ImageIcon, Users,
  ArrowUpRight, Clock,
} from "lucide-react";

// ─── Semua yang berisi React component/function WAJIB ada di client ───────────
const STATS_CONFIG = [
  {
    key:        "earning",
    label:      "Total Earning",
    value:      "$12,480",           // placeholder — ganti dengan data real
    change:     "+8.2% this month",
    icon:       DollarSign,
    iconBg:     "bg-emerald-50",
    iconColor:  "text-emerald-500",
    valueColor: "text-emerald-600",
    accentBg:   "from-emerald-400 to-emerald-500",
  },
  {
    key:        "downloads",
    label:      "Total Downloads",
    value:      "34,291",            // placeholder
    change:     "+12.5% this month",
    icon:       Download,
    iconBg:     "bg-blue-50",
    iconColor:  "text-blue-500",
    valueColor: "text-blue-600",
    accentBg:   "from-blue-400 to-blue-500",
  },
  {
    key:        "assets",
    label:      "Total Assets",
    value:      "756",               // placeholder
    change:     "+3 this week",
    icon:       ImageIcon,
    iconBg:     "bg-orange-50",
    iconColor:  "text-orange-500",
    valueColor: "text-orange-500",
    accentBg:   "from-orange-400 to-orange-500",
  },
  {
    key:        "users",
    label:      "Total Users",
    icon:       Users,
    iconBg:     "bg-slate-100",
    iconColor:  "text-slate-500",
    valueColor: "text-slate-800",
    accentBg:   "from-slate-400 to-slate-500",
  },
] as const;

// ─── Props hanya primitif ─────────────────────────────────────────────────────
interface StatsData {
  totalUsers: number;
  adminCount: number;
  userCount:  number;
}

interface Props {
  statsData: StatsData;
  children:  React.ReactNode;
}

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function DashboardShell({ statsData, children }: Props) {
  // Resolve nilai untuk card "users" dari props primitif
  const resolvedValues: Record<string, { value: string; change: string }> = {
    earning:   { value: "$12,480", change: "+8.2% this month"  },
    downloads: { value: "34,291",  change: "+12.5% this month" },
    assets:    { value: "756",     change: "+3 this week"      },
    users: {
      value:  String(statsData.totalUsers),
      change: `${statsData.userCount} regular · ${statsData.adminCount} admin`,
    },
  };

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
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitor TrackStock platform performance
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 bg-white border border-orange-100 rounded-xl text-xs text-slate-400 shadow-sm">
          <Clock size={12} />
          Last updated: just now
        </div>
      </motion.div>

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS_CONFIG.map((stat) => {
          const Icon    = stat.icon;
          const { value, change } = resolvedValues[stat.key];

          return (
            <motion.div
              key={stat.key}
              variants={fadeUp}
              whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(249,115,22,0.10)" }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm p-5 cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <Icon size={18} className={stat.iconColor} />
                </div>
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-500">
                  <ArrowUpRight size={12} />
                </span>
              </div>

              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className={`text-3xl font-bold ${stat.valueColor} leading-none tracking-tight`}>
                {value}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">{change}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Konten lain (chart, activity, dll) ───────────────────── */}
      <motion.div variants={fadeUp} className="space-y-6">
        {children}
      </motion.div>
    </motion.div>
  );
}