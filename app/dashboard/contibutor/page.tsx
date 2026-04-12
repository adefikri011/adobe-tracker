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
} from "lucide-react";
import { Navbar } from "../_components/Navbar";

export default function ContributorPage() {
  const [searchId, setSearchId] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isPro, setIsPro] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => {
        const isProPlan =
          d.isPremium !== undefined ? d.isPremium : d.plan === "pro";
        setIsPro(isProPlan);
        setPlanLoading(false);
      })
      .catch(() => setPlanLoading(false));
  }, []);

  const handleSearch = () => {
    if (searchId.trim()) setShowResults(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setSearchId("");
    setShowResults(false);
  };

  const mockContributor = {
    id: "202488794",
    name: "xy_studio",
    totalAssets: 145,
    totalDownloads: 8542,
    rating: 4.8,
    joinDate: "Jun 2019",
    topCategory: "Business",
    weeklyGrowth: "+12%",
  };

  const mockAssets = [
    {
      id: "57383738",
      title: "Display of Stock Market",
      category: "Business",
      type: "Photo",
      downloads: 256,
      views: 1820,
      thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=260&fit=crop",
      uploadDate: "27 Jun 2019",
      trending: true,
    },
    {
      id: "64352337",
      title: "Stock Market Quotes Display",
      category: "Finance",
      type: "Vector",
      downloads: 189,
      views: 940,
      thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=260&fit=crop&sat=-80",
      uploadDate: "15 Jul 2019",
      trending: false,
    },
    {
      id: "103458765",
      title: "Stock Market Graph Analysis",
      category: "Business",
      type: "Photo",
      downloads: 412,
      views: 3210,
      thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=260&fit=crop",
      uploadDate: "22 Aug 2019",
      trending: true,
    },
    {
      id: "121910498",
      title: "Economical Stock Market Graph",
      category: "Finance",
      type: "Photo",
      downloads: 178,
      views: 760,
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=260&fit=crop",
      uploadDate: "10 Sep 2019",
      trending: false,
    },
    {
      id: "125435283",
      title: "Stock Exchange Concept",
      category: "Business",
      type: "Vector",
      downloads: 95,
      views: 430,
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=260&fit=crop",
      uploadDate: "05 Oct 2019",
      trending: false,
    },
    {
      id: "134830386",
      title: "Brokers Analysing Stocks",
      category: "Business",
      type: "Photo",
      downloads: 334,
      views: 2100,
      thumbnail: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&h=260&fit=crop",
      uploadDate: "18 Nov 2019",
      trending: true,
    },
  ];

  const filteredAssets =
    selectedFilter === "All"
      ? mockAssets
      : selectedFilter === "Trending"
      ? mockAssets.filter((a) => a.trending)
      : mockAssets.filter(
          (a) => a.type === selectedFilter || a.category === selectedFilter
        );

  return (
    <>
      <Navbar isPro={isPro} planLoading={planLoading} />

      <div className="min-h-screen bg-white">
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

              {/* sample IDs */}
              <div className="mt-8 flex flex-wrap gap-2 justify-center">
                {["202488794", "198374650", "305827401"].map((id) => (
                  <button
                    key={id}
                    onClick={() => { setSearchId(id); setShowResults(true); }}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition flex items-center gap-1.5"
                  >
                    {id}
                    <ChevronRight size={11} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">

              {/* ── CONTRIBUTOR PROFILE ── */}
              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg shadow-orange-200">
                  {mockContributor.name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-bold text-slate-900">{mockContributor.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">ACTIVE</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">ID: {mockContributor.id} · Joined {mockContributor.joinDate}</p>
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
                    value: mockContributor.totalAssets,
                    sub: "Published works",
                    icon: <ImageIcon size={18} className="text-orange-400" />,
                    accent: "orange",
                  },
                  {
                    label: "TOTAL DOWNLOADS",
                    value: mockContributor.totalDownloads.toLocaleString(),
                    sub: "Across all assets",
                    icon: <Download size={18} className="text-green-400" />,
                    accent: "green",
                  },
                  {
                    label: "AVG RATING",
                    value: mockContributor.rating,
                    sub: "Average score",
                    icon: <Star size={18} className="text-yellow-400" />,
                    accent: "yellow",
                  },
                  {
                    label: "WEEKLY GROWTH",
                    value: mockContributor.weeklyGrowth,
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
                  <span className="font-bold text-orange-600">{mockContributor.topCategory}</span>
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
                    <p className="text-xs text-slate-400 mt-0.5">{filteredAssets.length} assets found</p>
                  </div>
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
      </div>
    </>
  );
}