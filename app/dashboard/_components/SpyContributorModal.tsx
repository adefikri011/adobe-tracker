"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2, AlertCircle, Users, TrendingUp, Download, BarChart3 } from "lucide-react";

interface SpyContributorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContributorData {
  name?: string;
  totalDownloads?: number;
  assetCount?: number;
  averageDownloads?: number;
  topCategory?: string;
}

export function SpyContributorModal({ isOpen, onClose }: SpyContributorModalProps) {
  const [searchId, setSearchId] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string>("");
  const [contributor, setContributor] = useState<ContributorData | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  // Check feature access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/user/feature-check");
        const data = await res.json();
        setHasAccess(data.allowed || false);
      } catch (err) {
        setHasAccess(false);
      } finally {
        setAccessLoading(false);
      }
    };

    if (isOpen) {
      checkAccess();
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchId.trim()) return;

    setSearching(true);
    setError("");
    setContributor(null);
    setAssets([]);

    try {
      const response = await fetch(`/api/dashboard/contributors?id=${encodeURIComponent(searchId)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Contributor not found");
        return;
      }

      setContributor({
        name: `Contributor ${searchId}`,
        totalDownloads: data.totalDownloads || 0,
        assetCount: data.assetCount || 0,
        averageDownloads: data.totalDownloads && data.assetCount ? Math.round(data.totalDownloads / data.assetCount) : 0,
      });

      setAssets(data.assets || []);
    } catch (err) {
      setError("Failed to fetch contributor data");
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !searching) {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchId("");
    setContributor(null);
    setAssets([]);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* ── HEADER ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 flex items-center justify-between border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                <Users size={20} className="text-orange-400" />
              </div>
              Spy Contributor
            </h2>
            <p className="text-sm text-slate-400 mt-1">Search & analyze competitor portfolios</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div className="overflow-y-auto flex-1 p-8">
          {accessLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-orange-500" />
            </div>
          ) : !hasAccess ? (
            // Access blocked
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pro Feature</h3>
              <p className="text-slate-600 mb-6">
                Spy Contributor is only available for PRO subscribers. Upgrade your plan to access this feature.
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="/pricing"
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold hover:opacity-90 transition"
                >
                  Upgrade Now
                </a>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search Section */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Contributor ID</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Enter contributor ID…"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={searching}
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={!searchId.trim() || searching}
                    className="px-6 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {searching && <Loader2 size={18} className="animate-spin" />}
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Results */}
              {contributor && (
                <div className="space-y-6">
                  {/* Contributor Stats */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{contributor.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Assets</p>
                        <p className="text-2xl font-bold text-slate-900">{contributor.assetCount}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Downloads</p>
                        <p className="text-2xl font-bold text-slate-900">{contributor.totalDownloads?.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Avg Downloads</p>
                        <p className="text-2xl font-bold text-slate-900">{contributor.averageDownloads}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Top Category</p>
                        <p className="text-lg font-bold text-slate-900 capitalize truncate">{contributor.topCategory || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assets List */}
                  {assets.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-4">Top Assets ({assets.slice(0, 5).length})</h4>
                      <div className="space-y-3">
                        {assets.slice(0, 5).map((asset, idx) => (
                          <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-orange-400/50 hover:shadow-md transition">
                            <div className="flex items-start gap-4">
                              {asset.thumbnail && (
                                <img
                                  src={asset.thumbnail}
                                  alt={asset.title}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{asset.title}</p>
                                <div className="flex gap-3 text-sm text-slate-600 mt-2">
                                  <span className="flex items-center gap-1">
                                    <Download size={14} />
                                    {asset.downloads?.toLocaleString()} downloads
                                  </span>
                                  {asset.category && (
                                    <span className="text-slate-500 capitalize">{asset.category}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {assets.length === 0 && !searching && (
                    <div className="text-center py-8 text-slate-500">
                      <p>No assets found for this contributor</p>
                    </div>
                  )}
                </div>
              )}

              {!contributor && !error && !searching && (
                <div className="text-center py-12 text-slate-500">
                  <Users size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">Enter a contributor ID to get started</p>
                  <p className="text-sm mt-2">Search for any contributor to analyze their portfolio and top-performing assets</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        {contributor && (
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex justify-end gap-3">
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
