"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────
type Asset = {
  id: string;
  adobeId: string;
  title: string;
  creator: string;
  creatorName?: string;
  creatorId?: string;
  category: string;
  type: string;
  downloads: number;
  score: number;
  trend: string;
  revenue: string;
  status: string;
  thumbnail?: string;
  uploadDate?: string;
  contentUrl?: string;
  artistUrl?: string;
  keywords?: string[];
};

type FetchState = {
  results: Asset[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
};

const CONTENT_TYPES = ["All", "Image", "Vector", "Video", "Illustration", "Template", "3D"];
const SORT_OPTIONS = [
  { label: "Most Downloads", value: "most-downloaded" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Undiscovered", value: "undiscovered" },
];
const STATUS_FILTERS = ["All Status", "Premium", "Free"];

// ── Helpers (same as search route / result-card) ───────────────────────────
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

// ── CopyBtn ────────────────────────────────────────────────────────────────
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

// ── ImageModal ─────────────────────────────────────────────────────────────
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

// ── Skeleton Card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ border: "1px solid #f0ede8" }}>
      <div className="w-full aspect-[4/3] bg-orange-50" />
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
    </div>
  );
}

// ── Asset Card ─────────────────────────────────────────────────────────────
function AssetCard({
  item,
  index,
  onDelete,
}: {
  item: Asset;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const score = item.score ?? getPerformanceScore(item.downloads);
  const timeAgo = item.uploadDate ? getTimeAgoFromDate(item.uploadDate) : "";
  const keywords = item.keywords && item.keywords.length > 0 ? item.keywords : [];
  const allKeywordsText = keywords.join(", ");

  const perfColor =
    score >= 70
      ? { bg: "#16a34a", light: "#dcfce7", text: "#15803d" }
      : score >= 40
      ? { bg: "#f97316", light: "#fff7ed", text: "#ea580c" }
      : { bg: "#94a3b8", light: "#f1f5f9", text: "#64748b" };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.ok) onDelete(item.id);
      else alert("Failed to delete asset");
    } catch {
      alert("Failed to delete asset");
    } finally {
      setDeleting(false);
    }
  };

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
        style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
      >
        {/* Thumbnail */}
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
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl bg-orange-50">🖼️</div>
          )}

          <motion.div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: hovering ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          <motion.div
            className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2.5 px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: hovering ? 1 : 0, y: hovering ? 0 : 10 }}
            transition={{ duration: 0.25 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-white"
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.32)" }}
            >
              🔍 Preview
            </motion.button>
            {item.contentUrl && (
              <motion.a
                href={item.contentUrl} target="_blank" rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", border: "1px solid rgba(249,115,22,0.4)" }}
              >
                🔗 Adobe Stock
              </motion.a>
            )}
          </motion.div>

          {/* Status badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
              style={{
                background: item.status === "Free" ? "rgba(22,163,74,0.92)" : "rgba(234,88,12,0.92)",
                color: "#fff",
                backdropFilter: "blur(4px)",
              }}
            >
              {item.status}
            </span>
          </div>

          {/* Type badge */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.9)", color: "#6b7280", backdropFilter: "blur(4px)" }}
            >
              {item.type}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-0.5 gap-2">
              <p className="text-[9px] font-black text-orange-300 uppercase tracking-[0.18em]">Asset Title</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setShowFullTitle((v) => !v)}
                  className="text-[10px] font-semibold transition-colors duration-150 flex-shrink-0"
                  style={{ color: "#ea580c" }}
                >
                  {showFullTitle ? "Show Less" : "Show All"}
                </button>
                <CopyBtn text={item.title} label="Copy title" />
              </div>
            </div>
            <h3
              className={`text-[13px] font-bold text-gray-800 leading-snug group-hover:text-orange-500 transition-colors duration-200 ${showFullTitle ? "" : "line-clamp-2"}`}
            >
              {item.title}
            </h3>
          </div>

          {/* Adobe ID */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#fafafa", border: "1px solid #f0ede8" }}>
            <div>
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-wider leading-none mb-0.5">Adobe ID</p>
              <p className="text-[11px] font-mono font-bold text-gray-600">{item.adobeId}</p>
            </div>
            <CopyBtn text={item.adobeId} label="Copy Adobe ID" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", border: "1px solid #fed7aa" }}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-orange-400 text-[10px]">⬇</span>
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider">Downloads</span>
              </div>
              <div className="text-xl font-black text-orange-600">{item.downloads.toLocaleString()}</div>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `linear-gradient(135deg, ${perfColor.light}, ${perfColor.light})`, border: `1px solid ${perfColor.bg}30` }}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px]" style={{ color: perfColor.text }}>⚡</span>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: perfColor.text }}>Score</span>
              </div>
              <div className="flex items-end gap-0.5">
                <span className="text-xl font-black" style={{ color: perfColor.bg }}>{score}</span>
                <span className="text-[11px] font-medium mb-0.5" style={{ color: perfColor.text }}>/100</span>
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: perfColor.bg }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.9, delay: index * 0.07 + 0.3, ease: "easeOut" }}
            />
          </div>

          {/* Revenue */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-sm">💰</span>
              <div>
                <p className="text-[8px] font-black text-green-400 uppercase tracking-wider leading-none mb-0.5">Revenue</p>
                <p className="text-[13px] font-black text-green-700">{item.revenue}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: "#dcfce7", color: "#16a34a" }}>
              {item.trend}
            </span>
          </div>

          {/* Category */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
            <div className="flex items-center gap-2">
              <span className="text-[14px]">🗂️</span>
              <div>
                <p className="text-[8px] font-black text-orange-300 uppercase tracking-wider leading-none mb-0.5">Category</p>
                <p className="text-[12px] font-bold text-orange-600 leading-none">{item.category || "General"}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
              {item.type}
            </span>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-orange-100 bg-orange-50">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f97316, #c2410c)" }}
            >
              {(item.creatorName || item.creator).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black text-orange-400 uppercase tracking-wider">{item.creatorName || item.creator}</p>
              <p className="text-[11px] font-semibold text-gray-700 truncate">{item.creatorId || item.creator}</p>
            </div>
          </div>

          {/* Upload date */}
          {item.uploadDate && item.uploadDate !== "-" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <span className="text-green-500 text-xs">📅</span>
              <span className="text-[11px] text-green-700">
                {item.uploadDate}
                {timeAgo && <span className="text-green-400 ml-1.5 font-normal">· {timeAgo}</span>}
              </span>
            </div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div style={{ borderTop: "1px solid #f0ede8" }} className="pt-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400 text-xs">🏷</span>
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider">Keywords</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "#fff7ed", color: "#ea580c" }}>
                    {keywords.length}
                  </span>
                </div>
                <CopyBtn text={allKeywordsText} label={`Copy all ${keywords.length} keywords`} />
              </div>
              <div className="flex flex-wrap gap-1">
                {keywords.slice(0, 8).map((kw, i) => (
                  <motion.span
                    key={`${kw}-${i}`}
                    whileHover={{ scale: 1.06 }}
                    className="text-[10px] px-2 py-0.5 rounded-md cursor-default transition-all duration-150"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b" }}
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

          {/* Admin Actions */}
          <div className="flex gap-2 pt-1" style={{ borderTop: "1px solid #f0ede8" }}>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-200"
              style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}
            >
              ✏️ Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 disabled:opacity-50"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
            >
              {deleting ? "Deleting…" : "🗑 Delete"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, color = "#f97316", delay = 0, loading = false,
}: { icon: string; label: string; value: string; sub: string; color?: string; delay?: number; loading?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl p-5 flex flex-col gap-2"
      style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}15` }}>
          {icon}
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: "#f0fdf4", color: "#16a34a" }}>
          ↑ Live
        </span>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-black" style={{ color }}>{value}</p>
        )}
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminAssetPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("most-downloaded");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [page, setPage] = useState(1);

  const [state, setState] = useState<FetchState>({
    results: [],
    total: 0,
    totalPages: 1,
    loading: true,
    error: null,
  });

  // Debounce search — same 400ms as typical search UX
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [selectedType, selectedStatus, sortBy]);

  // Fetch from /api/admin/assets — same pattern as search route
  const fetchAssets = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        contentType: selectedType === "All" ? "all" : selectedType.toLowerCase(),
        sortBy,
        status: selectedStatus === "All Status" ? "all" : selectedStatus.toLowerCase(),
        page: String(page),
      });

      const res = await fetch(`/api/admin/assets?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch");
      }
      const data = await res.json();
      setState({
        results: data.results ?? [],
        total: data.total ?? 0,
        totalPages: data.totalPages ?? 1,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [debouncedQuery, selectedType, selectedStatus, sortBy, page]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleDelete = (deletedId: string) => {
    setState((prev) => ({
      ...prev,
      results: prev.results.filter((a) => a.id !== deletedId),
      total: prev.total - 1,
    }));
  };

  const totalDownloads = state.results.reduce((s, a) => s + a.downloads, 0);
  const totalRevenue = state.results.reduce(
    (s, a) => s + parseFloat(a.revenue.replace(/[$,]/g, "")),
    0
  );

  return (
    <div className="min-h-screen" style={{ background: "#fafaf8" }}>
      {/* Page Header */}
      <div className="px-6 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Asset Management</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Monitor & manage all stock assets in the database</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              Last updated: just now
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
            >
              + Add Asset
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="🖼️" label="Total Assets" value={state.total.toLocaleString()} sub="Assets in database" color="#f97316" delay={0.05} loading={state.loading} />
        <StatCard icon="⬇️" label="Total Downloads" value={totalDownloads.toLocaleString()} sub="This page downloads" color="#3b82f6" delay={0.1} loading={state.loading} />
        <StatCard icon="💰" label="Est. Revenue" value={`$${totalRevenue.toFixed(0)}`} sub="This page estimate" color="#16a34a" delay={0.15} loading={state.loading} />
        <StatCard icon="📄" label="Page" value={`${page} / ${state.totalPages}`} sub="Current page" color="#8b5cf6" delay={0.2} loading={state.loading} />
      </div>

      {/* Filters */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-2xl p-4 flex flex-wrap gap-3 items-center"
          style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search assets by title, category, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] font-medium outline-none transition-all"
              style={{ background: "#fafaf8", border: "1.5px solid #f0ede8", color: "#374151" }}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#f97316"; }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#f0ede8"; }}
            />
          </div>

          {/* Content type pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CONTENT_TYPES.map((t) => (
              <motion.button
                key={t}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSelectedType(t)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200"
                style={
                  selectedType === t
                    ? { background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff" }
                    : { background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }
                }
              >
                {t}
              </motion.button>
            ))}
          </div>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] font-semibold outline-none cursor-pointer"
            style={{ background: "#fafaf8", border: "1.5px solid #f0ede8", color: "#6b7280" }}
          >
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] font-semibold outline-none cursor-pointer"
            style={{ background: "#fafaf8", border: "1.5px solid #f0ede8", color: "#6b7280" }}
          >
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
            {(["grid", "list"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="px-3 py-2 text-[12px] font-bold transition-all duration-200"
                style={viewMode === m ? { background: "#f97316", color: "#fff" } : { background: "#fff", color: "#94a3b8" }}
              >
                {m === "grid" ? "⊞" : "☰"}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Results info */}
      <div className="px-6 mb-4 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-gray-400">
          {state.loading ? (
            <span className="animate-pulse">Loading assets…</span>
          ) : (
            <>
              Showing <span className="font-black text-orange-500">{state.results.length}</span> of{" "}
              <span className="font-black text-gray-600">{state.total.toLocaleString()}</span> assets
              {debouncedQuery && <span className="ml-2 text-orange-400">for "{debouncedQuery}"</span>}
            </>
          )}
        </p>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-[11px] font-bold px-3 py-1 rounded-lg"
            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Error state */}
      {state.error && (
        <div className="px-6 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-red-400">⚠️</span>
            <p className="text-[12px] font-semibold text-red-600">{state.error}</p>
            <button
              onClick={fetchAssets}
              className="ml-auto text-[11px] font-bold px-3 py-1 rounded-lg"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Asset Grid */}
      <div className="px-6 pb-8">
        {state.loading ? (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : state.results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-black text-gray-800 mb-2">No assets found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedType("All"); setSelectedStatus("All Status"); }}
              className="mt-6 px-6 py-2.5 rounded-xl text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {state.results.map((item, i) => (
              <AssetCard key={item.id} item={item} index={i} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!state.loading && state.totalPages > 1 && (
        <div className="px-6 pb-12 flex items-center justify-center gap-2 flex-wrap">
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40"
            style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}
          >
            ← Prev
          </motion.button>

          {Array.from({ length: Math.min(state.totalPages, 7) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <motion.button
                key={pageNum}
                whileTap={{ scale: 0.94 }}
                onClick={() => setPage(pageNum)}
                className="w-9 h-9 rounded-xl text-[12px] font-bold transition-all"
                style={
                  page === pageNum
                    ? { background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff" }
                    : { background: "#fff", color: "#94a3b8", border: "1px solid #e2e8f0" }
                }
              >
                {pageNum}
              </motion.button>
            );
          })}

          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={page === state.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40"
            style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}
          >
            Next →
          </motion.button>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Add New Asset</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Upload and configure a new stock asset</p>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-gray-400 hover:bg-gray-100 transition-colors">
                  ✕
                </button>
              </div>

              <div
                className="rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer mb-6"
                style={{ border: "2px dashed #fed7aa", background: "#fff7ed" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#f97316"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#fed7aa"; }}
              >
                <div className="text-4xl">📁</div>
                <p className="text-[13px] font-bold text-orange-500">Click to upload or drag & drop</p>
                <p className="text-[11px] text-gray-400">PNG, JPG, SVG, MP4, AI up to 100MB</p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { label: "Asset Title", placeholder: "Enter asset title..." },
                  { label: "Category", placeholder: "e.g. Nature, Business, Abstract..." },
                  { label: "Adobe Stock ID", placeholder: "e.g. 480123456" },
                ].map(({ label, placeholder }) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <input
                      type="text" placeholder={placeholder}
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] font-medium outline-none"
                      style={{ background: "#fafaf8", border: "1.5px solid #f0ede8", color: "#374151" }}
                      onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#f97316"; }}
                      onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#f0ede8"; }}
                    />
                  </div>
                ))}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Content Type</p>
                  <select className="w-full px-3 py-2.5 rounded-xl text-[13px] font-medium outline-none" style={{ background: "#fafaf8", border: "1.5px solid #f0ede8", color: "#374151" }}>
                    {["Photo", "Vector", "Video", "Illustration", "Template", "3D"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowUploadModal(false)} className="flex-1 py-3 rounded-xl text-[13px] font-bold" style={{ background: "#f8fafc", color: "#6b7280", border: "1px solid #e2e8f0" }}>
                  Cancel
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                  Save Asset
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}