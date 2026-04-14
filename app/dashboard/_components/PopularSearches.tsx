"use client";
import { ArrowRight, TrendingUp, Zap, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface PopularSearchesProps {
  onSearchSelect?: (query: string) => void;
  onUpgradePro?: () => void;
  isPro?: boolean;
}

interface QuickTip {
  emoji: string;
  text: string;
}

interface PopularSearch {
  term: string;
  count?: number;
  hot: boolean;
}

const DEFAULT_POPULAR_SEARCHES: PopularSearch[] = [
  { term: "artificial intelligence", hot: true },
  { term: "nature", hot: false },
  { term: "business", hot: false },
  { term: "cybersecurity", hot: true },
  { term: "lifestyle", hot: false },
  { term: "health", hot: false },
  { term: "travel", hot: false },
  { term: "finance", hot: false },
  { term: "education", hot: false },
  { term: "food", hot: false },
  { term: "urban", hot: false },
  { term: "people", hot: false },
];

// Emoji mapping for search terms
const SEARCH_TERM_EMOJIS: Record<string, string> = {
  "artificial intelligence": "🤖",
  nature: "🌿",
  business: "💼",
  cybersecurity: "🔐",
  lifestyle: "📸",
  health: "🏥",
  travel: "✈️",
  finance: "💰",
  education: "🎓",
  food: "🍽️",
  urban: "🌆",
  people: "👥",
};

const CATEGORIES = [
  {
    name: "Photos",
    count: "840K+",
    color: "orange",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    name: "Videos",
    count: "310K+",
    color: "sky",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    ),
  },
  {
    name: "Vectors",
    count: "560K+",
    color: "purple",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    name: "Templates",
    count: "190K+",
    color: "green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="3" height="9" />
        <rect x="14" y="7" width="3" height="5" />
      </svg>
    ),
  },
];

const categoryStyles: Record<string, { wrap: string; icon: string; card: string }> = {
  orange: {
    wrap: "bg-orange-500/10",
    icon: "text-orange-500",
    card: "hover:border-orange-400/40 hover:shadow-orange-500/10",
  },
  sky: {
    wrap: "bg-sky-500/10",
    icon: "text-sky-400",
    card: "hover:border-sky-400/40 hover:shadow-sky-500/10",
  },
  purple: {
    wrap: "bg-purple-500/10",
    icon: "text-purple-400",
    card: "hover:border-purple-400/40 hover:shadow-purple-500/10",
  },
  green: {
    wrap: "bg-green-500/10",
    icon: "text-green-400",
    card: "hover:border-green-400/40 hover:shadow-green-500/10",
  },
};

const PRO_FEATURES = [
  { icon: TrendingUp, text: "Unlimited keyword analytics" },
  { icon: Zap, text: "Real-time trend alerts" },
];

const QUICK_TIPS = [
  { emoji: "🎯", text: "Focus on trending keywords to maximize visibility" },
  { emoji: "🏷️", text: "Use AI-powered tags for better asset discoverability" },
  { emoji: "📊", text: "Monitor competition regularly and adjust pricing" },
  { emoji: "⏰", text: "Update content at optimal times for better reach" },
];

export function PopularSearches({ onSearchSelect, onUpgradePro, isPro = false }: PopularSearchesProps) {
  const [quickTips, setQuickTips] = useState<QuickTip[]>(QUICK_TIPS);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>(DEFAULT_POPULAR_SEARCHES);
  const [searchesLoading, setSearchesLoading] = useState(true);

  // Fetch quick tips
  useEffect(() => {
    const fetchQuickTips = async () => {
      try {
        const res = await fetch("/api/dashboard/quick-tips", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("Failed to fetch quick tips:", res.status);
          return;
        }

        const data = await res.json();
        if (data.tips && Array.isArray(data.tips)) {
          setQuickTips(data.tips);
        }
      } catch (error) {
        console.error("Error fetching quick tips:", error);
      } finally {
        setTipsLoading(false);
      }
    };

    fetchQuickTips();
  }, []);

  // Fetch trending searches (real-time from all users)
  useEffect(() => {
    const fetchTrendingSearches = async () => {
      try {
        const res = await fetch("/api/dashboard/trending-searches", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("Failed to fetch trending searches:", res.status);
          return;
        }

        const data = await res.json();
        if (data.searches && Array.isArray(data.searches)) {
          setPopularSearches(data.searches);
        }
      } catch (error) {
        console.error("Error fetching trending searches:", error);
      } finally {
        setSearchesLoading(false);
      }
    };

    fetchTrendingSearches();
  }, []);

  return (
    <div className="mt-10 sm:mt-14 max-w-4xl mx-auto px-4 sm:px-0 space-y-8">

      {/* ── PRO BANNER (Only for FREE users) ── */}
      {!isPro && (
      <div className="relative overflow-hidden rounded-2xl bg-[#0f0f1a] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
        {/* glow blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 w-44 h-44 rounded-full bg-pink-600/15 blur-3xl" />

        {/* Left */}
        <div className="relative flex items-start gap-4 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-orange-500 to-pink-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base font-semibold text-white">Upgrade to Pro</span>
              <span className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                For Contributors
              </span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-sm">
              Unlock deeper analytics, trend alerts & AI suggestions — grow your Adobe Stock revenue faster.
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  <Icon size={11} className="text-orange-500 shrink-0" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onUpgradePro}
          className="relative shrink-0 self-start sm:self-center flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
        >
          Get Pro
          <ArrowRight size={14} />
        </button>
      </div>
      )}

      {/* ── POPULAR SEARCHES ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="block w-[3px] h-5 rounded-full bg-gradient-to-b from-orange-500 to-pink-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Popular searches
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-5 ml-[18px]">
          Tap a keyword to instantly explore top-performing assets
        </p>

        <div className="flex flex-wrap gap-2.5">
          {searchesLoading
            ? DEFAULT_POPULAR_SEARCHES.map(({ term, hot }) => (
                <div
                  key={term}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 animate-pulse"
                >
                  <span className="text-sm leading-none w-5 h-5 rounded bg-gray-200" />
                  <span className="text-[13px] font-medium capitalize text-gray-400 w-24 h-4 rounded bg-gray-200" />
                </div>
              ))
            : popularSearches.map(({ term, hot }) => (
                <button
                  key={term}
                  onClick={() => onSearchSelect?.(term)}
                  className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 transition-all duration-150 hover:border-orange-400/60 hover:bg-orange-50 hover:-translate-y-px active:scale-95"
                >
                  <span className="text-sm leading-none">{SEARCH_TERM_EMOJIS[term] || "🔍"}</span>
                  <span className="text-[13px] font-medium capitalize text-gray-700 group-hover:text-orange-600 transition-colors">
                    {term}
                  </span>
                  {hot && (
                    <span className="rounded-full bg-gradient-to-r from-orange-500 to-pink-600 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                      HOT
                    </span>
                  )}
                </button>
              ))}
        </div>
      </div>

      {/* ── BROWSE BY TYPE ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="block w-[3px] h-5 rounded-full bg-gradient-to-b from-orange-500 to-pink-600" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            Browse by type
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(({ name, count, color, icon }) => {
            const s = categoryStyles[color];
            return (
              <button
                key={name}
                onClick={() => onSearchSelect?.(name.toLowerCase())}
                className={`group flex flex-col items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-6 transition-all duration-150 hover:shadow-lg hover:-translate-y-1 active:scale-95 ${s.card}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] transition-transform duration-150 group-hover:scale-105 ${s.wrap} ${s.icon}`}>
                  {icon}
                </div>
                <span className="text-sm font-semibold text-gray-800">{name}</span>
                <span className="text-[11px] text-gray-400">{count} assets</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── QUICK TIPS ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="block w-[3px] h-5 rounded-full bg-gradient-to-b from-orange-500 to-pink-600" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            Pro Tips to Boost Revenue
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tipsLoading
            ? QUICK_TIPS.map(({ emoji, text }) => (
                <div
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-50 p-4 animate-pulse"
                >
                  <span className="text-2xl shrink-0">{emoji}</span>
                  <span className="text-sm text-gray-400 leading-relaxed font-medium">{text}</span>
                </div>
              ))
            : quickTips.map(({ emoji, text }) => (
                <div
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 transition-all duration-150 hover:border-orange-300/60 hover:shadow-lg hover:shadow-orange-500/10"
                >
                  <span className="text-2xl shrink-0">{emoji}</span>
                  <span className="text-sm text-gray-700 leading-relaxed font-medium">{text}</span>
                </div>
              ))}
        </div>
      </div>

    </div>
  );
}