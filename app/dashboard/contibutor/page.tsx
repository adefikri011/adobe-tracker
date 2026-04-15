"use client";

import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Users,
  Download,
  BarChart3,
  ImageIcon,
  Star,
  Grid3X3,
  Filter,
  ChevronRight,
  Flame,
  Trophy,
  ArrowUpRight,
  Clock,
  Eye,
  AlertCircle,
  X,
  Zap,
} from "lucide-react";
import { Navbar } from "../_components/Navbar";
import UpgradeAccessModal from "../../components/UpgradeAccessModal";

export default function ContributorPage() {
  const [searchId, setSearchId] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [hasAccess, setHasAccess] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [userPlan, setUserPlan] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // API data states
  const [contributor, setContributor] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [limitExceeded, setLimitExceeded] = useState<{
    message: string;
    dailyLimit: number;
    currentUsage: number;
    resetTime: string;
  } | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Check SPY_CONTRIBUTOR feature access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/user/feature-check");
        const data = await res.json();
        const allowed = data.allowed || false;
        setHasAccess(allowed);
        setUserPlan(data.plan || "free");
        
        // Show modal if user doesn't have access
        if (!allowed) {
          setShowUpgradeModal(true);
        }
      } catch (err) {
        console.error("Error checking feature access:", err);
        setHasAccess(false);
        setShowUpgradeModal(true);
      } finally {
        setPlanLoading(false);
      }
    };

    checkAccess();
  }, []);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    
    setLoading(true);
    setError("");
    setLimitExceeded(null);
    
    try {
      const response = await fetch(`/api/contributor/search?search=${encodeURIComponent(searchId)}`);
      const data = await response.json();
      
      if (!response.ok) {
        // Handle limit exceeded (429)
        if (response.status === 429 && data.limitExceeded) {
          setLimitExceeded({
            message: data.message,
            dailyLimit: data.dailyLimit,
            currentUsage: data.currentUsage,
            resetTime: data.resetTime,
          });
          setShowLimitModal(true);
          setShowResults(false);
        } else {
          setError(data.error || "Contributor not found");
          setShowResults(false);
        }
        return;
      }
      
      setContributor(data.contributor);
      setAssets(data.assets);
      setShowResults(true);
    } catch (err) {
      console.error("[Search Error]", err);
      setError("Failed to search. Please try again.");
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setSearchId("");
    setShowResults(false);
    setContributor(null);
    setAssets([]);
    setError("");
    setLimitExceeded(null);
  };

  const filteredAssets =
    selectedFilter === "All"
      ? assets
      : selectedFilter === "Trending"
      ? assets.filter((a) => a.trending)
      : assets.filter(
          (a) => a.type === selectedFilter || a.category === selectedFilter
        );

  return (
    <>
      <Navbar isPro={hasAccess} planLoading={planLoading} />

      <div className="min-h-screen bg-white">
        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        {!planLoading && (
          <>
            {/* ── UPGRADE MODAL ─────────────────────────────────── */}
            <UpgradeAccessModal
              isOpen={showUpgradeModal}
              featureName="Spy Contributor"
              currentPlan={userPlan}
              onClose={() => setShowUpgradeModal(false)}
            />

            {/* ── LIMIT EXCEEDED MODAL ─────────────────────────────────── */}
            {showLimitModal && limitExceeded && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95">
                  <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="text-orange-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-orange-900 text-lg">Daily Limit Reached</h3>
                        <p className="text-orange-700 text-sm mt-1">{limitExceeded.message}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 space-y-3">
                    <div className="p-3 bg-white rounded-lg border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-600 font-semibold">Today's Searches</span>
                        <span className="text-sm font-bold text-orange-600">{limitExceeded.currentUsage} / {limitExceeded.dailyLimit}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{width: `${Math.min(100, (limitExceeded.currentUsage / limitExceeded.dailyLimit) * 100)}%`}}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                          <Clock size={14} />
                          Resets at
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {new Date(limitExceeded.resetTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 text-center">
                      Your daily contributor search limit will reset tomorrow. Please try again then!
                    </p>
                  </div>

                  <div className="px-6 py-4 flex gap-3 border-t border-slate-200">
                    <button
                      onClick={() => setShowLimitModal(false)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowLimitModal(false);
                        setSearchId("");
                      }}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
                    >
                      Clear Search
                    </button>
                  </div>
                </div>
              </div>
            )}

            {hasAccess ? (
              <>
        {/* ── HERO SEARCH ─────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-60 h-60 rounded-full bg-orange-400/5 blur-2xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto px-6 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
              Explore Contributor
              <span className="text-orange-400"> Portfolios</span>
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              Search by Contributor ID to view their portfolio, statistics, and assets
            </p>

            {/* search bar */}
            <div className="flex gap-2 max-w-xl mx-auto">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  type="text"
                  placeholder="Enter contributor ID…"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchId.trim()}
                className="px-6 py-3.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
              >
                Search
              </button>
            </div>

            {/* quick stats */}
            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-500">
              <span className="flex items-center gap-1"><BarChart3 size={12} className="text-orange-400" /> 1.7K+ Assets Indexed</span>
              <span className="w-px h-3 bg-slate-700" />
              <span className="flex items-center gap-1"><Users size={12} className="text-orange-400" /> Active Contributors</span>
              <span className="w-px h-3 bg-slate-700" />
              <span className="flex items-center gap-1"><TrendingUp size={12} className="text-orange-400" /> Real-time Data</span>
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ───────────────────────────────────── */}
        <div className="border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <Filter size={14} className="text-slate-400 shrink-0" />
            {["All", "Photo", "Vector", "Business", "Finance", "Trending"].map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    selectedFilter === f
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "Trending" && <Flame size={10} />}
                  {f}
                </button>
              )
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-6 py-10">
          
          {/* ── LIMIT EXCEEDED BANNER ─────────────────────────────────── */}
          {limitExceeded && (
            <div className="mb-6 p-4 rounded-xl border border-orange-200 bg-orange-50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="text-orange-600" size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-1">Daily Limit Reached</h4>
                <p className="text-sm text-orange-700 mb-2">{limitExceeded.message}</p>
                <div className="flex items-center justify-between text-xs text-orange-600 font-medium">
                  <span>{limitExceeded.currentUsage} of {limitExceeded.dailyLimit} searches used</span>
                  <span>Resets at {new Date(limitExceeded.resetTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
              <button
                onClick={() => setLimitExceeded(null)}
                className="p-1 text-orange-600 hover:bg-orange-100 rounded transition flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {!showResults ? (
            /* ── EMPTY STATE ── */
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-5">
                <BarChart3 size={36} className="text-orange-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Search a Contributor
              </h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                Enter a contributor ID above to view their portfolio, download stats, and latest assets.
              </p>
            </div>
          ) : loading ? (
            /* LOADING STATE */
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin" />
              <p className="mt-6 text-slate-600 font-medium">Searching for contributor...</p>
            </div>
          ) : limitExceeded ? (
            /* LIMIT EXCEEDED STATE */
            <div className="max-w-md mx-auto py-16">
              <div className="p-6 rounded-xl border border-orange-200 bg-orange-50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-900 mb-1">Daily Limit Reached</h3>
                    <p className="text-orange-700 text-sm">{limitExceeded.message}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg border border-orange-100 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Today's Searches:</span>
                    <span className="font-semibold text-slate-900">{limitExceeded.currentUsage} / {limitExceeded.dailyLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resets at:</span>
                    <span className="font-semibold text-slate-900">{new Date(limitExceeded.resetTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="w-full mt-4 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition"
                >
                  Try Again Tomorrow
                </button>
              </div>
            </div>
          ) : error ? (
            /* ERROR STATE */
            <div className="max-w-md mx-auto py-16">
              <div className="p-6 rounded-xl border border-red-200 bg-red-50">
                <h3 className="font-bold text-red-900 mb-2">Search Failed</h3>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">

              {/* ── CONTRIBUTOR PROFILE ── */}
              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg shadow-orange-200">
                  {contributor?.name?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-bold text-slate-900">{contributor?.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">ACTIVE</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">ID: {contributor?.id} · Joined {contributor?.joinDate}</p>
                </div>

                <button className="px-4 py-2 rounded-xl border border-orange-200 text-orange-600 text-xs font-semibold hover:bg-orange-50 transition flex items-center gap-1.5 shrink-0">
                  View on Adobe <ArrowUpRight size={12} />
                </button>
              </div>

              {/* ── STATS ROW ── (matching dashboard cards style) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "TOTAL ASSETS",
                    value: contributor?.totalAssets,
                    sub: "Published works",
                    icon: <ImageIcon size={18} className="text-orange-400" />,
                    accent: "orange",
                  },
                  {
                    label: "TOTAL DOWNLOADS",
                    value: contributor?.totalDownloads?.toLocaleString?.(),
                    sub: "Across all assets",
                    icon: <Download size={18} className="text-green-400" />,
                    accent: "green",
                  },
                  {
                    label: "AVG RATING",
                    value: contributor?.rating,
                    sub: "Average score",
                    icon: <Star size={18} className="text-yellow-400" />,
                    accent: "yellow",
                  },
                  {
                    label: "WEEKLY GROWTH",
                    value: contributor?.weeklyGrowth,
                    sub: "Downloads this week",
                    icon: <TrendingUp size={18} className="text-blue-400" />,
                    accent: "blue",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {stat.label}
                      </p>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 mb-0.5">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-400">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── TOP CATEGORY STRIP ── */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <Trophy size={18} className="text-orange-500 shrink-0" />
                <div className="text-sm text-slate-700">
                  Top performing category:{" "}
                  <span className="font-bold text-orange-600">{contributor?.topCategory}</span>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-orange-600">
                  <Flame size={12} /> Most downloaded
                </div>
              </div>

              {/* ── ASSETS SECTION ── */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Latest Assets</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{filteredAssets?.length || 0} assets found</p>
                  </div>
                  {assets && assets.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-orange-100 text-orange-600" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <Grid3X3 size={15} />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-orange-100 text-orange-600" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <BarChart3 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                      >
                        {/* thumbnail */}
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img
                            src={asset.thumbnail}
                            alt={asset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* badges */}
                          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-white/90 text-orange-600 text-[10px] font-bold shadow">
                              {asset.type}
                            </span>
                            {asset.trending && (
                              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center gap-0.5">
                                <Flame size={9} /> Trending
                              </span>
                            )}
                          </div>

                          {/* hover CTA */}
                          <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button className="w-full py-2 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-orange-500 hover:text-white transition">
                              View Asset
                            </button>
                          </div>
                        </div>

                        {/* info */}
                        <div className="p-4 space-y-3">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                              {asset.category}
                            </span>
                            <h3 className="text-sm font-semibold text-slate-800 mt-0.5 line-clamp-1 group-hover:text-orange-600 transition">
                              {asset.title}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-400">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Download size={11} /> {asset.downloads}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={11} /> {asset.views.toLocaleString()}
                              </span>
                            </div>
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {asset.uploadDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* list view */
                  <div className="space-y-2">
                    {filteredAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition cursor-pointer group"
                      >
                        <img
                          src={asset.thumbnail}
                          alt={asset.title}
                          className="w-16 h-12 object-cover rounded-lg shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                              {asset.type}
                            </span>
                            {asset.trending && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-500 flex items-center gap-0.5">
                                <Flame size={9} /> Trending
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-orange-600 transition">
                            {asset.title}
                          </p>
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <p className="text-sm font-bold text-slate-700 flex items-center gap-1 justify-end">
                            <Download size={12} /> {asset.downloads}
                          </p>
                          <p className="text-xs text-slate-400">{asset.uploadDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── LOAD MORE ── */}
              <div className="flex justify-center pt-4 gap-4">
                <button className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition">
                  Load More Assets
                </button>
                <button
                  onClick={handleClear}
                  className="text-sm text-slate-400 hover:text-slate-600 transition"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}
        </div>
              </>
            ) : (
              <div className="min-h-screen bg-white"></div>
            )}
          </>
        )}
      </div>
    </>
  );
}