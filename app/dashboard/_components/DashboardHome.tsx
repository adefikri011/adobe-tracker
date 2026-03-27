"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const CHART_DATA = [
  { day: "Mon", downloads: 420 },
  { day: "Tue", downloads: 380 },
  { day: "Wed", downloads: 510 },
  { day: "Thu", downloads: 470 },
  { day: "Fri", downloads: 620 },
  { day: "Sat", downloads: 580 },
  { day: "Sun", downloads: 490 },
];

const CATEGORY_DATA = [
  { name: "Nature", value: 4200 },
  { name: "Business", value: 3100 },
  { name: "Abstract", value: 2400 },
  { name: "Technology", value: 1900 },
  { name: "Lifestyle", value: 1600 },
];

interface StatsData {
  totalAssets: number;
  avgDownloadsDay: number;
  topCategory: string;
  trendingQuery: string;
  trendingGrowth: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function DashboardHome() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setStatsLoading(false);
      })
      .catch(() => setStatsLoading(false));
  }, []);

  const statCards = [
    {
      label: "Total Assets Indexed",
      value: statsLoading ? "..." : stats?.totalAssets ? formatNumber(stats.totalAssets) : "0",
      sub: "From cached searches",
    },
    {
      label: "Avg Downloads/Day",
      value: statsLoading ? "..." : stats?.avgDownloadsDay ? formatNumber(stats.avgDownloadsDay) : "0",
      sub: "Across all categories",
    },
    {
      label: "Top Category",
      value: statsLoading ? "..." : stats?.topCategory || "—",
      sub: "Most downloaded",
    },
    {
      label: "Trending Now",
      value: statsLoading ? "..." : stats?.trendingQuery || "—",
      sub: statsLoading ? "" : stats?.trendingGrowth ? `${stats.trendingGrowth} this week` : "",
    },
  ];

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
            <div className="text-white/40 text-xs mb-2 leading-tight">{s.label}</div>
            <div
              className={`text-xl sm:text-2xl font-bold text-orange-500 truncate transition-opacity duration-500 ${
                statsLoading ? "opacity-30 animate-pulse" : "opacity-100"
              }`}
            >
              {s.value}
            </div>
            <div className="text-white/30 text-xs mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
          <h3 className="font-semibold mb-1">Download Trend</h3>
          <p className="text-white/30 text-xs mb-4 sm:mb-6">Last 7 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="downloads" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
          <h3 className="font-semibold mb-1">Top Categories</h3>
          <p className="text-white/30 text-xs mb-4 sm:mb-6">By total downloads</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CATEGORY_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} width={65} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}