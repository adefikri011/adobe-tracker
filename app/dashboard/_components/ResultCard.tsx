"use client";

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
};

const PREVIEW: Record<string, string> = {
  Nature: "🌅",
  Business: "💼",
  Abstract: "🌊",
  Technology: "💻",
  Lifestyle: "☕",
  Art: "🌸",
  Urban: "🌃",
  Default: "📷",
};

// Derive a fake "performance score" from downloads (0–100)
function getPerformanceScore(downloads: number): number {
  return Math.min(100, Math.round((downloads / 100) * 100));
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "rgba(34,197,94,0.15)";
  if (score >= 40) return "rgba(249,115,22,0.15)";
  return "rgba(239,68,68,0.15)";
}

// Fake keywords derived from title words
function getKeywords(title: string, category: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 4);
  return [category.toLowerCase(), ...words].slice(0, 5);
}

interface ResultCardProps {
  item: Asset;
  index: number;
}

export function ResultCard({ item, index }: ResultCardProps) {
  const score = getPerformanceScore(item.downloads);
  const scoreColor = getScoreColor(score);
  const scoreBg = getScoreBg(score);
  const keywords = getKeywords(item.title, item.category);
  const trendIsPositive = item.trend.startsWith("+");

  return (
    <div
      className="group relative bg-[#111] border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* ── Thumbnail ── */}
      <div className="relative w-full aspect-[4/3] bg-white/5 overflow-hidden">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute("style");
            }}
          />
        ) : null}

        {/* Emoji fallback — hidden if thumbnail loads */}
        <div
          className="absolute inset-0 flex items-center justify-center text-5xl"
          style={item.thumbnail ? { display: "none" } : {}}
        >
          {PREVIEW[item.category] ?? PREVIEW.Default}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type badge top-right */}
        <div className="absolute top-2.5 right-2.5">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
            {item.type}
          </span>
        </div>

        {/* Trend badge top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm"
            style={{
              background: trendIsPositive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
              border: trendIsPositive ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(239,68,68,0.4)",
              color: trendIsPositive ? "#4ade80" : "#f87171",
            }}
          >
            {item.trend}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-white leading-snug mb-0.5 line-clamp-2 group-hover:text-orange-100 transition-colors">
          {item.title}
        </h3>
        <p className="text-[11px] text-white/35 mb-3 truncate">by {item.creator}</p>

        {/* Downloads + Performance score */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <div className="text-[10px] text-orange-400/70 mb-0.5 uppercase tracking-wide">Downloads</div>
            <div className="text-base font-bold text-orange-400">{item.downloads.toLocaleString()}</div>
          </div>
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ background: scoreBg, border: `1px solid ${scoreColor}33` }}
          >
            <div className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: `${scoreColor}99` }}>
              Performance
            </div>
            <div className="text-base font-bold" style={{ color: scoreColor }}>
              {score}
              <span className="text-[10px] font-normal opacity-60">/100</span>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <span className="text-[11px] text-white/30">Revenue Est.</span>
          <span className="text-sm font-bold text-orange-400">{item.revenue}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] mb-3" />

        {/* Keywords */}
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw, i) => (
            <span
              key={`${kw}-${i}`}
              className="text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-default"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Locked placeholder card ────────────────────────────────────
export function LockedCard() {
  return (
    <div className="relative bg-[#111] border border-white/[0.08] rounded-2xl overflow-hidden opacity-40 blur-[2px] pointer-events-none select-none">
      <div className="w-full aspect-[4/3] bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2 bg-white/5 rounded w-1/2" />
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-12 bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}