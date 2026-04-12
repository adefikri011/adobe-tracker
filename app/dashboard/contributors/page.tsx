"use client";

export default function ContributorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 italic tracking-tight">
            <span className="text-orange-500">Contributors</span> Gallery
          </h1>
          <p className="text-sm text-slate-600 font-medium">Search and explore assets by contributor ID</p>
        </div>

        {/* COMING SOON */}
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <div className="text-6xl">👷</div>
            <h2 className="text-2xl font-black text-slate-800">Coming Soon</h2>
            <p className="text-slate-600 font-medium">Contributors search features will be added soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
