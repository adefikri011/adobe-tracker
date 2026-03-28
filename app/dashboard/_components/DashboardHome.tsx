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
      icon: "📦",
    },
    {
      label: "Avg Downloads/Day",
      value: statsLoading ? "..." : stats?.avgDownloadsDay ? formatNumber(stats.avgDownloadsDay) : "0",
      sub: "Across all categories",
      icon: "📥",
    },
    {
      label: "Top Category",
      value: statsLoading ? "..." : stats?.topCategory || "—",
      sub: "Most downloaded",
      icon: "🏆",
    },
    {
      label: "Trending Now",
      value: statsLoading ? "..." : stats?.trendingQuery || "—",
      sub: statsLoading ? "" : stats?.trendingGrowth ? `${stats.trendingGrowth} this week` : "",
      icon: "🔥",
    },
  ];

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", padding: "24px", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "#1a2332",
          margin: 0,
          letterSpacing: "-0.3px",
        }}>
          Dashboard Overview</h2>
        <p style={{ color: "#8a96a8", fontSize: "13px", marginTop: "4px" }}>
          Track your Adobe Stock analytics in real-time
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}>
        {statCards.map((s) => (
          <div
            key={s.label}
            style={{
              background: "#ffffff",
              border: "1.5px solid #e8ecf2",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 12px rgba(26,35,50,0.06)",
              transition: "box-shadow 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(249,115,22,0.12)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(26,35,50,0.06)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ color: "#8a96a8", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                {s.label}
              </span>
              <span style={{
                background: "#fff4ed",
                borderRadius: "8px",
                padding: "4px 8px",
                fontSize: "14px",
              }}>{s.icon}</span>
            </div>
            <div style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#f97316",
              letterSpacing: "-0.5px",
              opacity: statsLoading ? 0.3 : 1,
              transition: "opacity 0.4s",
            }}>
              {s.value}
            </div>
            <div style={{ color: "#adb5c2", fontSize: "12px", marginTop: "6px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
      }}>
        {/* Line Chart */}
        <div style={{
          background: "#ffffff",
          border: "1.5px solid #e8ecf2",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(26,35,50,0.06)",
        }}>
          <h3 style={{ fontWeight: 700, color: "#1a2332", margin: 0, fontSize: "15px" }}>
            Download Trend
          </h3>
          <p style={{ color: "#adb5c2", fontSize: "12px", margin: "4px 0 20px" }}>Last 7 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
              <XAxis
                dataKey="day"
                stroke="#c8d0db"
                tick={{ fontSize: 11, fill: "#8a96a8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#c8d0db"
                tick={{ fontSize: 11, fill: "#8a96a8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1.5px solid #e8ecf2",
                  borderRadius: "10px",
                  boxShadow: "0 4px 16px rgba(26,35,50,0.1)",
                  color: "#1a2332",
                  fontSize: "12px",
                }}
                cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Line
                type="monotone"
                dataKey="downloads"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#f97316", stroke: "#fff4ed", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div style={{
          background: "#ffffff",
          border: "1.5px solid #e8ecf2",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(26,35,50,0.06)",
        }}>
          <h3 style={{ fontWeight: 700, color: "#1a2332", margin: 0, fontSize: "15px" }}>
            Top Categories
          </h3>
          <p style={{ color: "#adb5c2", fontSize: "12px", margin: "4px 0 20px" }}>By total downloads</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CATEGORY_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
              <XAxis
                type="number"
                stroke="#c8d0db"
                tick={{ fontSize: 11, fill: "#8a96a8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#c8d0db"
                tick={{ fontSize: 11, fill: "#8a96a8" }}
                width={72}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1.5px solid #e8ecf2",
                  borderRadius: "10px",
                  boxShadow: "0 4px 16px rgba(26,35,50,0.1)",
                  color: "#1a2332",
                  fontSize: "12px",
                }}
                cursor={{ fill: "#fff4ed" }}
              />
              <Bar dataKey="value" fill="#f97316" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}