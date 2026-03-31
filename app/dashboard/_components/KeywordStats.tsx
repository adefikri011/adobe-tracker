"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Asset } from "./ResultCard";

interface KeywordStatsProps {
  results: Asset[];
  query: string;
  total: number;
}

export function KeywordStats({ results, query, total }: KeywordStatsProps) {
  const stats = useMemo(() => {
    if (!results.length) return null;

    const totalDownloads = results.reduce((s, r) => s + (r.downloads || 0), 0);
    const avgDownloads = Math.round(totalDownloads / results.length);

    const typeCounts: Record<string, number> = {};
    results.forEach((r) => {
      const t = r.type || "Photo";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Photo";

    let competitionLevel: string;
    let competitionColor: string;
    let competitionBg: string;
    let competitionPct: string;
    if (avgDownloads >= 80) {
      competitionLevel = "Very High"; competitionColor = "#ef4444";
      competitionBg = "#fef2f2"; competitionPct = "95%";
    } else if (avgDownloads >= 50) {
      competitionLevel = "High"; competitionColor = "#f97316";
      competitionBg = "#fff7ed"; competitionPct = "72%";
    } else if (avgDownloads >= 20) {
      competitionLevel = "Medium"; competitionColor = "#d97706";
      competitionBg = "#fffbeb"; competitionPct = "48%";
    } else {
      competitionLevel = "Low"; competitionColor = "#16a34a";
      competitionBg = "#f0fdf4"; competitionPct = "24%";
    }

    return { totalDownloads, avgDownloads, dominantType, competitionLevel, competitionColor, competitionBg, competitionPct };
  }, [results]);

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5 rounded-2xl overflow-hidden"
      style={{ border: "1px solid #f0ede8", background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
    >
      {/* Top orange accent line */}
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #f97316 0%, #fb923c 50%, #fed7aa 100%)" }} />

      <div className="grid grid-cols-2 sm:grid-cols-4">

        {/* 1 — Market Size */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="relative flex items-center gap-3.5 px-5 py-5"
          style={{ borderRight: "1px solid #f5f0eb" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)" }}>
            🔍
          </div>
          <div>
            <p className="text-[9px] font-black text-orange-300 uppercase tracking-[0.16em] mb-1">Market Size</p>
            <p className="text-2xl font-black text-gray-800 leading-none">{total.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              for <span className="text-orange-500 font-bold">"{query}"</span>
            </p>
          </div>
        </motion.div>

        {/* 2 — Total Downloads */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
          className="relative flex items-center gap-3.5 px-5 py-5"
          style={{ borderRight: "1px solid #f5f0eb" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)" }}>
            ⬇️
          </div>
          <div>
            <p className="text-[9px] font-black text-orange-300 uppercase tracking-[0.16em] mb-1">Total Downloads</p>
            <p className="text-2xl font-black text-orange-500 leading-none">{stats.totalDownloads.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              avg <span className="text-orange-400 font-bold">{stats.avgDownloads}</span>/asset
            </p>
          </div>
        </motion.div>

        {/* 3 — Top Content */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="relative flex items-center gap-3.5 px-5 py-5"
          style={{ borderRight: "1px solid #f5f0eb" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: "#f8fafc" }}>
            🗂️
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.16em] mb-1">Top Content</p>
            <p className="text-2xl font-black text-gray-700 leading-none">{stats.dominantType}</p>
            <p className="text-[10px] text-gray-400 mt-1">dominant type</p>
          </div>
        </motion.div>

        {/* 4 — Competition */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.21 }}
          className="flex items-center gap-3.5 px-5 py-5"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: stats.competitionBg }}>
            🎯
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.16em] mb-1">Competition</p>
            <p className="text-2xl font-black leading-none" style={{ color: stats.competitionColor }}>
              {stats.competitionLevel}
            </p>
            <div className="mt-2 w-full h-1 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: stats.competitionColor }}
                initial={{ width: 0 }}
                animate={{ width: stats.competitionPct }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}