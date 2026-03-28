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

function getPerformanceScore(downloads: number): number {
  return Math.min(100, Math.round((downloads / 100) * 100));
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "rgba(34,197,94,0.08)";
  if (score >= 40) return "rgba(249,115,22,0.08)";
  return "rgba(239,68,68,0.08)";
}

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
      className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-400/50 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* ── Thumbnail ── */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
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

        {/* Emoji fallback */}
        <div
          className="absolute inset-0 flex items-center justify-center text-5xl"
          style={item.thumbnail ? { display: "none" } : {}}
        >
          {PREVIEW[item.category] ?? PREVIEW.Default}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type badge top-right */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm"
            style={{
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#475569",
            }}
          >
            {item.type}
          </span>
        </div>

        {/* Trend badge top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm"
            style={{
              background: trendIsPositive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: trendIsPositive ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)",
              color: trendIsPositive ? "#16a34a" : "#dc2626",
            }}
          >
            {item.trend}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-0.5 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-[11px] text-gray-400 mb-3 truncate">by {item.creator}</p>

        {/* Downloads + Performance score */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.18)" }}
          >
            <div className="text-[10px] text-orange-500/70 mb-0.5 uppercase tracking-wide">Downloads</div>
            <div className="text-base font-bold text-orange-500">{item.downloads.toLocaleString()}</div>
          </div>
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ background: scoreBg, border: `1px solid ${scoreColor}28` }}
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
          <span className="text-[11px] text-gray-400">Revenue Est.</span>
          <span className="text-sm font-bold text-orange-500">{item.revenue}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-3" />

        {/* Keywords */}
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw, i) => (
            <span
              key={`${kw}-${i}`}
              className="text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-default"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#94a3b8",
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
    <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden opacity-40 blur-[2px] pointer-events-none select-none">
      <div className="w-full aspect-[4/3] bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-100 rounded w-1/2" />
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}