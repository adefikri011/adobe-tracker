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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
      {/* Assets Found */}
      <div className="group relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(249,115,22,0.02))",
          border: "1px solid rgba(249,115,22,0.15)",
          backdropFilter: "blur(8px)"
        }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at top-right, rgba(249,115,22,0.1), transparent)",
          }} />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Market Size</div>
          </div>
          <div className="text-3xl font-black text-slate-900">{results.length}</div>
          <div className="text-xs text-slate-500 font-medium">for <span className="text-orange-600 font-bold">&ldquo;{query}&rdquo;</span></div>
        </div>
      </div>

      {/* Total Downloads */}
      <div className="group relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))",
          border: "1px solid rgba(59,130,246,0.15)",
          backdropFilter: "blur(8px)"
        }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at top-right, rgba(59,130,246,0.1), transparent)",
          }} />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⬇️</span>
            <div className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Total Downloads</div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalDownloads.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium">avg <span className="text-blue-600 font-bold">{Math.round(totalDownloads / results.length || 0)}</span>/asset</div>
        </div>
      </div>

      {/* Avg Downloads */}
      <div className="group relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))",
          border: "1px solid rgba(34,197,94,0.15)",
          backdropFilter: "blur(8px)"
        }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at top-right, rgba(34,197,94,0.1), transparent)",
          }} />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <div className="text-[10px] font-black text-green-600 uppercase tracking-wider">Avg Downloads</div>
          </div>
          <div className="text-3xl font-black text-slate-900">{avgDownloads.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium"><span className="text-green-600 font-bold">per asset</span> average</div>
        </div>
      </div>

      {/* Fastest Growing */}
      <div className="group relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, rgba(236,72,153,0.08), rgba(236,72,153,0.02))",
          border: "1px solid rgba(236,72,153,0.15)",
          backdropFilter: "blur(8px)"
        }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at top-right, rgba(236,72,153,0.1), transparent)",
          }} />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div className="text-[10px] font-black text-pink-600 uppercase tracking-wider">Trending</div>
          </div>
          <div className="text-3xl font-black text-slate-900">{trendingAsset?.trend ?? "—"}</div>
          <div className="text-xs text-slate-500 font-medium truncate"><span className="text-pink-600 font-bold">growth</span> spike</div>
        </div>
      </div>
    </div>
  );
}