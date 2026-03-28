"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  Eye,
  Search,
  Star,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stats = [
  { label: "Assets Tracked", value: "2.4M+", icon: TrendingUp, trend: "+12%", live: true },
  { label: "Contributors", value: "18K+", icon: Users, trend: "+5%", live: false },
  { label: "Data Points/Day", value: "500K+", icon: Activity, trend: "+24%", live: false },
];

// Line chart points for Download Trend (last 7 days)
const trendPoints = [420, 460, 440, 510, 490, 540, 480];

function MiniLineChart() {
  const w = 280, h = 60;
  const min = Math.min(...trendPoints) - 30;
  const max = Math.max(...trendPoints) + 20;
  const pts = trendPoints.map((v, i) => {
    const x = (i / (trendPoints.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(" L ")}`;
  const areaD = `M 0,${h} L ${pts.join(" L ")} L ${w},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#trendGrad)" />
      <path d={pathD} fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {trendPoints.map((v, i) => {
        const x = (i / (trendPoints.length - 1)) * w;
        const y = h - ((v - min) / (max - min)) * h;
        return <circle key={i} cx={x} cy={y} r="3" fill="#f97316" stroke="white" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

function DashboardMockup() {
  const categories = [
    { name: "Nature", pct: 88 },
    { name: "Business", pct: 72 },
    { name: "Abstract", pct: 58 },
    { name: "People", pct: 44 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <div className="rounded-2xl border border-slate-200 shadow-2xl shadow-slate-300/20 overflow-hidden bg-white">

        {/* ── Top Navbar ── */}
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3 bg-white">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div> */}
            <div className="leading-tight">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-900">Track</span>
              <span className="text-[10px] sm:text-[11px] font-black text-orange-500">Stock</span>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">Analytics Pro</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* PRO badge */}
          <div className="flex items-center gap-1 px-2 py-1 sm:px-3 rounded-full border border-green-200 bg-green-50 text-green-600">
            <Activity className="w-3 h-3" strokeWidth={2.5} />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">Pro Plan</span>
          </div>
        </div>

        {/* ── Search area ── */}
        <div className="bg-white px-3 py-4 sm:px-5 sm:pt-5 sm:pb-4 border-b border-slate-100">
          <p className="text-[13px] font-black text-slate-900 text-center mb-0.5">Adobe Stock Analytics</p>
          <p className="text-[10px] text-slate-400 font-medium text-center mb-3">Search any keyword to discover top-performing assets</p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span className="text-[11px] text-slate-400 font-medium truncate">Car Sport</span>
              <span className="w-px h-3 bg-orange-400 animate-pulse ml-0.5" />
            </div>
            <button className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white text-[11px] font-black rounded-xl shadow-md shadow-orange-200 flex-shrink-0">
              Search
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {["All Types", "Photo", "Vector", "Video", "Relevance", "Most Downloads", "Trending"].map((f, i) => (
              <span
                key={i}
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${i === 0
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-500 border-slate-200"
                  }`}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* ── Dashboard Overview ── */}
        <div className="p-5 bg-slate-50/50">
          <p className="text-[12px] font-black text-slate-800 mb-0.5">Dashboard Overview</p>
          <p className="text-[9px] text-slate-400 font-medium mb-3">Track your Adobe Stock analytics in real-time</p>

          {/* 4 KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { emoji: "/icons/package.svg", label: "Total Assets Indexed", value: "756", sub: "From cached searches" },
              { emoji: "/icons/barchart.svg", label: "Avg Downloads/Day", value: "208", sub: "Across all categories" },
              { emoji: "/icons/cup.svg", label: "Top Category", value: "Technology", sub: "Most downloaded", orange: true },
              { emoji: "/icons/flame.svg", label: "Trending Now", value: "nature", sub: "-76% this week", orange: true },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-tight">{kpi.label}</span>

                  {/* LOGIKA BARU: Cek apakah kpi.emoji itu path file atau karakter emoji biasa */}
                  {kpi.emoji.startsWith('/') ? (
                    <img src={kpi.emoji} alt={kpi.label} className="w-4 h-4 object-contain" />
                  ) : (
                    <span className="text-sm">{kpi.emoji}</span>
                  )}
                </div>

                <span className={`text-sm font-[900] leading-tight ${kpi.orange ? "text-orange-500" : "text-slate-900"}`}>
                  {kpi.value}
                </span>
                <span className="text-[8px] text-slate-400 font-medium">{kpi.sub}</span>
              </div>
            ))}
          </div>

          {/* Bottom 2 charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Download Trend */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black text-slate-800 mb-0.5">Download Trend</p>
              <p className="text-[8px] text-slate-400 font-medium mb-2">Last 7 days</p>
              {/* Y axis labels */}
              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-right pr-1 py-0.5">
                  {["800", "600", "400"].map(l => (
                    <span key={l} className="text-[7px] text-slate-300 font-medium">{l}</span>
                  ))}
                </div>
                <div className="flex-1 h-14">
                  <MiniLineChart />
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black text-slate-800 mb-0.5">Top Categories</p>
              <p className="text-[8px] text-slate-400 font-medium mb-2">By total downloads</p>
              <div className="flex flex-col gap-1.5">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-slate-500 w-12 text-right flex-shrink-0">{cat.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.pct}%` }}
                        transition={{ delay: 1.0 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                        className="h-full bg-orange-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="hero" className="relative pt-28 pb-0 md:pt-40 overflow-hidden bg-white" suppressHydrationWarning>
      {/* Dot grid */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-white/70 via-white/50 to-white" />

      {/* Glows */}
      <div className="absolute top-[-10%] left-[-8%] w-[520px] h-[520px] bg-orange-200/20 rounded-full blur-[140px] -z-10" />
      <div className="absolute top-[30%] right-[-10%] w-[380px] h-[380px] bg-slate-100/80 rounded-full blur-[100px] -z-10" />

      {mounted && (
        <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-6 text-center">

        {/* Headline */}
        <motion.h1
          variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="text-4xl sm:text-5xl md:text-7xl lg:text-[80px] font-[900] leading-[1.1] md:leading-[0.95] tracking-tighter mb-6 md:mb-8"
        >
          <span className="text-slate-900">Maximize Your Adobe Stock Royalties with</span>
          <br />
          <span className="text-orange-500 inline-block">Data-Driven Insights.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp} custom={2} initial="hidden" animate="show"
          className="text-slate-500 text-lg md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed font-medium px-4"
        >
          Stop guessing which assets sell. Get advanced tracking, real-time analytics, and portfolio performance tools designed for serious contributors who want to scale their earnings.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp} custom={3} initial="hidden" animate="show"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10 md:mb-12"
        >
          <Link
            href="/register"
            className="group relative flex items-center justify-center gap-2 w-full sm:w-auto bg-orange-500 px-8 py-4 rounded-2xl font-black text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Start for Free Now</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-full sm:w-auto bg-white px-8 py-4 rounded-2xl font-bold text-slate-700 border border-slate-200 hover:border-orange-200 hover:text-orange-600 transition-all shadow-sm"
          >
            Upgrade to Pro
          </Link>
        </motion.div>

        {/* Stats badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2.5 mb-14 md:mb-16"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm shadow-slate-100/80"
            >
              {stat.live ? (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              ) : (
                <stat.icon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              )}
              <span className="text-sm font-[900] text-slate-900 tracking-tight">{stat.value}</span>
              <span className="w-px h-3.5 bg-slate-200 flex-shrink-0" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{stat.label}</span>
              <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-2.5 h-2.5" />
                {stat.trend}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <DashboardMockup />
          {/* Smooth bleed into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
        </motion.div>

      </div>
      )}
    </section>
  );
}