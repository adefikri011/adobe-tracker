"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Asset = {
  adobeId: string;
  title: string;
  creator: string;
  category: string;
  type: string;
  downloads: number;
  trend: string;
  revenue: string;
  status: string;
  thumbnail?: string;
  uploadDate?: string;
  contentUrl?: string;
  artistUrl?: string;
  keywords?: string[];
};

function getPerformanceScore(downloads: number): number {
  return Math.min(100, Math.round((downloads / 500) * 100));
}

function getTimeAgoFromDate(dateStr: string): string {
  try {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return "";
    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    const years = Math.floor(diff / 31536000);
    const months = Math.floor(diff / 2592000);
    const days = Math.floor(diff / 86400);
    if (years > 0) return `${years}y ago`;
    if (months > 0) return `${months}mo ago`;
    if (days > 0) return `${days}d ago`;
    return "today";
  } catch {
    return "";
  }
}

function ImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.88)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <img src={src} alt={alt} className="max-w-full max-h-[85vh] object-contain" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          >
            ✕
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Small copy button ──
function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleCopy}
      title={copied ? "Copied!" : label}
      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all duration-200 flex-shrink-0"
      style={{
        background: copied ? "#dcfce7" : "#fff7ed",
        color: copied ? "#16a34a" : "#ea580c",
        border: `1px solid ${copied ? "#bbf7d0" : "#fed7aa"}`,
      }}
    >
      {copied ? "✓ Copied" : "⎘ Copy"}
    </motion.button>
  );
}

interface ResultCardProps {
  item: Asset;
  index: number;
}

export function ResultCard({ item, index }: ResultCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);

  const score = getPerformanceScore(item.downloads);
  const timeAgo = item.uploadDate ? getTimeAgoFromDate(item.uploadDate) : "";
  const keywords = item.keywords && item.keywords.length > 0 ? item.keywords : [];

  // Performance color — all warm, no blue
  const perfColor =
    score >= 70
      ? { bg: "#16a34a", light: "#dcfce7", text: "#15803d" }
      : score >= 40
      ? { bg: "#f97316", light: "#fff7ed", text: "#ea580c" }
      : { bg: "#94a3b8", light: "#f1f5f9", text: "#64748b" };

  const allKeywordsText = keywords.join(", ");

  return (
    <>
      {showModal && item.thumbnail && (
        <ImageModal src={item.thumbnail} alt={item.title} onClose={() => setShowModal(false)} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -6, transition: { duration: 0.22 } }}
        className="group relative bg-white rounded-2xl overflow-hidden flex flex-col"
        style={{
          border: "1px solid #f0ede8",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* ── Thumbnail ── */}
        <div
          className="relative w-full aspect-[4/3] overflow-hidden bg-gray-50 cursor-pointer"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onClick={() => item.thumbnail && setShowModal(true)}
        >
          {item.thumbnail ? (
            <motion.img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
              animate={{ scale: hovering ? 1.07 : 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl bg-orange-50">
              🖼️
            </div>
          )}

          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: hovering ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Action buttons */}
          <motion.div
            className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2.5 px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: hovering ? 1 : 0, y: hovering ? 0 : 10 }}
            transition={{ duration: 0.25 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-white"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.32)",
              }}
            >
              🔍 Preview
            </motion.button>

            {item.contentUrl && (
              <motion.a
                href={item.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  border: "1px solid rgba(249,115,22,0.4)",
                }}
              >
                🔗 Adobe Stock
              </motion.a>
            )}
          </motion.div>

          {/* Status badge — top left */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
              style={{
                background:
                  item.status === "Free"
                    ? "rgba(22,163,74,0.92)"
                    : "rgba(234,88,12,0.92)",
                color: "#fff",
                backdropFilter: "blur(4px)",
              }}
            >
              {item.status}
            </span>
          </div>

          {/* Type badge — top right */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.9)",
                color: "#6b7280",
                backdropFilter: "blur(4px)",
              }}
            >
              {item.type}
            </span>
          </div>
        </div>

        {/* ── Card Body ── */}
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Title — dengan Copy + Show All */}
          <div>
            {/* Label row */}
            <div className="flex items-center justify-between mb-0.5 gap-2">
              <p className="text-[9px] font-black text-orange-300 uppercase tracking-[0.18em]">
                Asset Title
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Show All / Show Less toggle */}
                <button
                  onClick={() => setShowFullTitle((v) => !v)}
                  className="text-[10px] font-semibold transition-colors duration-150 flex-shrink-0"
                  style={{ color: "#ea580c" }}
                >
                  {showFullTitle ? "Show Less" : "Show All"}
                </button>
                {/* Copy title */}
                <CopyBtn text={item.title} label="Copy title" />
              </div>
            </div>

            {/* Title text */}
            <h3
              className={`text-[13px] font-bold text-gray-800 leading-snug group-hover:text-orange-500 transition-colors duration-200 ${
                showFullTitle ? "" : "line-clamp-2"
              }`}
            >
              {item.title}
            </h3>
          </div>

          {/* ── Stats row: Downloads + Performance ── */}
          <div className="grid grid-cols-2 gap-2">
            {/* Downloads */}
            <div
              className="rounded-xl p-3"
              style={{
                background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
                border: "1px solid #fed7aa",
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="text-orange-400 text-[10px]">⬇</span>
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider">Downloads</span>
              </div>
              <div className="text-xl font-black text-orange-600">{item.downloads.toLocaleString()}</div>
            </div>

            {/* Performance */}
            <div
              className="rounded-xl p-3"
              style={{
                background: `linear-gradient(135deg, ${perfColor.light}, ${perfColor.light})`,
                border: `1px solid ${perfColor.bg}30`,
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px]" style={{ color: perfColor.text }}>⚡</span>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: perfColor.text }}>
                  Score
                </span>
              </div>
              <div className="flex items-end gap-0.5">
                <span className="text-xl font-black" style={{ color: perfColor.bg }}>{score}</span>
                <span className="text-[11px] font-medium mb-0.5" style={{ color: perfColor.text }}>/100</span>
              </div>
            </div>
          </div>

          {/* Progress bar for score */}
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: perfColor.bg }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.9, delay: index * 0.07 + 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Category + Type */}
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[14px]">🗂️</span>
              <div>
                <p className="text-[8px] font-black text-orange-300 uppercase tracking-wider leading-none mb-0.5">
                  Category
                </p>
                <p className="text-[12px] font-bold text-orange-600 leading-none">
                  {item.category || "General"}
                </p>
              </div>
            </div>
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}
            >
              {item.type}
            </span>
          </div>

          {/* Creator / Artist */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-orange-100 bg-orange-50">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f97316, #c2410c)" }}
            >
              {item.creator.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black text-orange-400 uppercase tracking-wider">Creator</p>
              <p className="text-[11px] font-semibold text-gray-700 truncate">
                {item.creator}
              </p>
            </div>
          </div>

          {/* Upload date */}
          {item.uploadDate && item.uploadDate !== "-" && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <span className="text-green-500 text-xs">📅</span>
              <span className="text-[11px] text-green-700">
                {item.uploadDate}
                {timeAgo && (
                  <span className="text-green-400 ml-1.5 font-normal">· {timeAgo}</span>
                )}
              </span>
            </div>
          )}

          {/* Artist / Portfolio Link */}
          {item.artistUrl && (
            <motion.a
              href={item.artistUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 2 }}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-[11px] font-semibold"
              style={{ border: "1px solid #fed7aa", background: "#fff7ed", color: "#ea580c" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#f97316";
                (e.currentTarget as HTMLElement).style.background = "#ffecd8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#fed7aa";
                (e.currentTarget as HTMLElement).style.background = "#fff7ed";
              }}
            >
              🔗 View Adobe Stock
              <span className="text-orange-300 text-base font-light">›</span>
            </motion.a>
          )}

          {/* Revenue */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: "#fafafa", border: "1px solid #f0ede8" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-gray-300 text-xs">💰</span>
              <span className="text-[11px] text-gray-400 font-medium">Revenue Est.</span>
            </div>
            <span
              className="text-sm font-black"
              style={{ color: "#ea580c" }}
            >
              {item.revenue}
            </span>
          </div>

          {/* Keywords — dengan Copy All */}
          {keywords.length > 0 && (
            <div style={{ borderTop: "1px solid #f0ede8" }} className="pt-3">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400 text-xs">🏷</span>
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider">
                    Keywords
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: "#fff7ed", color: "#ea580c" }}
                  >
                    {keywords.length}
                  </span>
                </div>
                {/* Copy All Keywords */}
                <CopyBtn text={allKeywordsText} label={`Copy all ${keywords.length} keywords`} />
              </div>

              {/* Keyword chips */}
              <div className="flex flex-wrap gap-1">
                {keywords.slice(0, 8).map((kw, i) => (
                  <motion.span
                    key={`${kw}-${i}`}
                    whileHover={{ scale: 1.06 }}
                    className="text-[10px] px-2 py-0.5 rounded-md cursor-default transition-all duration-150"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#64748b",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#fed7aa";
                      (e.currentTarget as HTMLElement).style.color = "#ea580c";
                      (e.currentTarget as HTMLElement).style.background = "#fff7ed";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                      (e.currentTarget as HTMLElement).style.color = "#64748b";
                      (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                    }}
                  >
                    {kw}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

export function LockedCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative bg-white rounded-2xl overflow-hidden opacity-30 blur-[2.5px] pointer-events-none select-none"
      style={{ border: "1px solid #f0ede8" }}
    >
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-100" />
      <div className="p-4 space-y-3">
        <div className="h-2.5 bg-orange-100 rounded-lg w-3/4" />
        <div className="h-2 bg-gray-100 rounded-lg w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-orange-50 rounded-xl border border-orange-100" />
          <div className="h-16 bg-gray-50 rounded-xl border border-gray-100" />
        </div>
        <div className="h-1.5 bg-orange-100 rounded-full" />
        <div className="h-9 bg-gray-50 rounded-xl" />
        <div className="h-9 bg-gray-50 rounded-xl" />
      </div>
    </motion.div>
  );
}