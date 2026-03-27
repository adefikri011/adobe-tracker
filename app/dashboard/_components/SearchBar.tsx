"use client";

interface SearchBarProps {
  query: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSearch: () => void;
}

const TYPE_FILTERS = ["All Types", "Photo", "Vector", "Video"];
const SORT_FILTERS = ["Relevance", "Most Downloads", "Trending"];

export function SearchBar({ query, loading, onChange, onSearch }: SearchBarProps) {
  return (
    <div className="text-center mb-8 sm:mb-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Adobe Stock Analytics</h1>
      <p className="text-white/40 text-sm mb-6 sm:mb-8">
        Search any keyword to discover top-performing assets
      </p>

      <div className="flex gap-2 sm:gap-3 max-w-2xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Try: 'nature', 'business'..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition min-w-0"
        />
        <button
          onClick={onSearch}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 flex-shrink-0"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:border-orange-500/40 hover:text-orange-400 transition"
          >
            {f}
          </button>
        ))}
        <span className="text-white/20 text-xs">|</span>
        {SORT_FILTERS.map((f) => (
          <button
            key={f}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:border-orange-500/40 hover:text-orange-400 transition"
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}