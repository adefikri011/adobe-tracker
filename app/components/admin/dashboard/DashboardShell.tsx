"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  DollarSign, Download, ImageIcon, Users,
  ArrowUpRight, Clock,
} from "lucide-react";

// ─── Semua yang berisi React component/function WAJIB ada di client ───────────
const STATS_CONFIG = [
  {
    key:        "earning",
    label:      "Total Earning",
    icon:       DollarSign,
    iconBg:     "bg-emerald-50",
    iconColor:  "text-emerald-500",
    valueColor: "text-emerald-600",
    accentBg:   "from-emerald-400 to-emerald-500",
  },
  {
    key:        "downloads",
    label:      "Total Downloads",
    icon:       Download,
    iconBg:     "bg-blue-50",
    iconColor:  "text-blue-500",
    valueColor: "text-blue-600",
    accentBg:   "from-blue-400 to-blue-500",
  },
  {
    key:        "assets",
    label:      "Total Assets",
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

interface DashboardStats {
  totalEarning: number;
  totalDownloads: number;
  totalAssets: number;
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
  const [dashStats, setDashStats] = useState<DashboardStats>({
    totalEarning: 0,
    totalDownloads: 0,
    totalAssets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setDashStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Resolve nilai untuk card dari API dan props
  const resolvedValues: Record<string, { value: string; change: string }> = {
    earning: { 
      value: `$${(dashStats.totalEarning || 0).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`, 
      change: "From transactions" 
    },
    downloads: { 
      value: (dashStats.totalDownloads || 0).toLocaleString(), 
      change: "Total downloads" 
    },
    assets: { 
      value: (dashStats.totalAssets || 0).toLocaleString(), 
      change: "Assets in database" 
    },
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
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 md:mt-1">
            Monitor TrackStock platform performance
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white border border-orange-100 rounded-xl text-xs text-slate-400 shadow-sm whitespace-nowrap">
          <Clock size={12} />
          <span className="hidden sm:inline">Last updated: just now</span>
          <span className="sm:hidden">Updated now</span>
        </div>
      </motion.div>

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS_CONFIG.map((stat) => {
          const Icon    = stat.icon;
          const { value, change } = resolvedValues[stat.key];
          const isLoading = loading && stat.key !== 'users';

          return (
            <motion.div
              key={stat.key}
              variants={fadeUp}
              whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(249,115,22,0.10)" }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={stat.iconColor} />
                </div>
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-500 flex-shrink-0">
                  <ArrowUpRight size={12} />
                </span>
              </div>

              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              
              {isLoading ? (
                <div className="animate-pulse h-8 bg-slate-100 rounded" />
              ) : (
                <p className={`text-2xl sm:text-3xl font-bold ${stat.valueColor} leading-none tracking-tight`}>
                  {value}
                </p>
              )}
              
              <p className="text-[11px] text-slate-400 mt-2">{change}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Content (chart, activity, etc.) ───────────────────────── */}
      <motion.div variants={fadeUp} className="space-y-4 sm:space-y-5 md:space-y-6">
        {children}
      </motion.div>
    </motion.div>
  );
}