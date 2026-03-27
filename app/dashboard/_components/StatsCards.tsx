"use client";

interface Asset {
  trend: string;
  title: string;
  downloads: number;
}

interface StatsCardsProps {
  results: Asset[];
  query: string;
}

export function StatsCards({ results, query }: StatsCardsProps) {
  const totalDownloads = results.reduce((s, a) => s + a.downloads, 0);
  const avgDownloads = results.length ? Math.round(totalDownloads / results.length) : 0;
  const trendingAsset = [...results].sort(
    (a, b) =>
      parseInt(b.trend.replace(/[^0-9]/g, "")) -
      parseInt(a.trend.replace(/[^0-9]/g, ""))
  )[0];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="text-white/40 text-xs mb-2">Assets Found</div>
        <div className="text-2xl font-bold text-orange-500">{results.length}</div>
        <div className="text-white/30 text-xs mt-1 truncate">for &ldquo;{query}&rdquo;</div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="text-white/40 text-xs mb-2">Total Downloads</div>
        <div className="text-2xl font-bold text-orange-500">{totalDownloads.toLocaleString()}</div>
        <div className="text-white/30 text-xs mt-1">across all results</div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="text-white/40 text-xs mb-2">Avg Downloads</div>
        <div className="text-2xl font-bold text-orange-500">{avgDownloads.toLocaleString()}</div>
        <div className="text-white/30 text-xs mt-1">per asset</div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="text-white/40 text-xs mb-2">Fastest Growing</div>
        <div className="text-lg font-bold text-green-400">{trendingAsset?.trend ?? "—"}</div>
        <div className="text-white/30 text-xs mt-1 truncate">{trendingAsset?.title ?? "—"}</div>
      </div>
    </div>
  );
}