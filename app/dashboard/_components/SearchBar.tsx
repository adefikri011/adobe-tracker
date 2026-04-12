"use client";
import { useState, useEffect, useRef } from "react";
import { X, Clock, Search, Trash2 } from "lucide-react";

interface SearchBarProps {
  query: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSearch: () => void;
}

interface RecentSearch {
  id: string;
  query: string;
  createdAt: string;
}

const searchSuggestions = [
  "Healthy organic food",
  "Sustainable energy concept",
  "Modern office architecture",
  "Minimalist interior design",
  "Cybersecurity data protection",
  "Fitness and wellness lifestyle",
  "Smart city infrastructure",
  "Professional medical team",
  "Automotive future technology",
  "Travel and adventure scenery",
];

function useTypewriter(texts: string[], speed = 60, pause = 1800) {
  const [displayed, setDisplayed] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = texts[textIndex];

    if (!deleting && charIndex < current.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      }, speed);
    } else if (!deleting && charIndex === current.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIndex > 0) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      }, speed / 2);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setTextIndex((i) => (i + 1) % texts.length);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [charIndex, deleting, textIndex, texts, speed, pause]);

  return displayed;
}

export function SearchBar({ query, loading, onChange, onSearch }: SearchBarProps) {
  const placeholder = useTypewriter(searchSuggestions);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Dipakai untuk trigger onSearch setelah onChange settle di parent
  const pendingSearchRef = useRef<string | null>(null);

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  // Ketika query di parent sudah match dengan pending, baru trigger onSearch
  useEffect(() => {
    if (pendingSearchRef.current !== null && query === pendingSearchRef.current) {
      pendingSearchRef.current = null;
      onSearch();
    }
  }, [query, onSearch]);

  const fetchRecentSearches = async () => {
    try {
      const res = await fetch("/api/user/recent-searches");
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(data.searches || []);
      }
    } catch (error) {
      console.error("Failed to fetch recent searches:", error);
    }
  };

  const saveSearch = async (q: string) => {
    try {
      await fetch("/api/user/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });
      fetchRecentSearches();
    } catch (error) {
      console.error("Failed to save search:", error);
    }
  };

  const handleSearch = async () => {
    if (query.trim()) {
      await saveSearch(query.trim());
      onSearch();
    }
  };

  // FIX: simpan ke ref dulu → onChange → useEffect yang trigger onSearch
  // supaya query di parent sudah ter-set sebelum onSearch dipanggil
  const handleRecentClick = async (searchQuery: string) => {
    // Save dulu, jangan await
    saveSearch(searchQuery).catch(err => 
      console.error("Failed to save recent search:", err)
    );
    // Baru trigger search
    pendingSearchRef.current = searchQuery;
    onChange(searchQuery);
  };

  const handleDeleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/user/recent-searches?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecentSearches((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete search:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch("/api/user/recent-searches?all=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setRecentSearches([]);
      }
    } catch (error) {
      console.error("Failed to clear searches:", error);
    }
  };

  return (
    <div className="text-center mb-8 sm:mb-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
        Adobe Stock Analytics
      </h1>
      <p className="text-gray-400 text-sm mb-6 sm:mb-8">
        Search any keyword to discover top-performing assets
      </p>

      {/* Search Input */}
      <div className="flex gap-2 sm:gap-3 max-w-2xl mx-auto">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder=""
            className="w-full bg-white border border-gray-200 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition shadow-sm"
          />
          {!query && (
            <div
              className="absolute inset-0 flex items-center px-4 sm:px-5 pointer-events-none select-none"
              aria-hidden="true"
            >
              <span className="text-sm text-gray-400 whitespace-nowrap overflow-hidden">
                {placeholder}
                <span
                  className="inline-block w-[1.5px] h-[13px] bg-orange-400 ml-[2px] align-middle"
                  style={{ animation: "tsbar-blink 1s step-end infinite" }}
                />
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 flex-shrink-0 text-white"
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

      <style>{`
        @keyframes tsbar-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="mt-5 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 px-1">
            {/* Label */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                Recent Searches
              </span>
              <span className="text-xs text-gray-300 font-medium">
                ({recentSearches.length})
              </span>
            </div>

            {/* Chips */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {recentSearches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => handleRecentClick(search.query)}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all duration-150 text-left"
                >
                  <Search
                    size={11}
                    className="text-gray-300 group-hover:text-orange-400 transition-colors shrink-0"
                  />
                  <span className="text-xs text-gray-600 font-medium group-hover:text-orange-700 transition-colors max-w-[120px] truncate">
                    {search.query}
                  </span>
                  <span
                    role="button"
                    onClick={(e) => handleDeleteOne(e as any, search.id)}
                    className="ml-0.5 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                  >
                    <X size={11} />
                  </span>
                </button>
              ))}
            </div>

            {/* Clear All */}
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-medium transition-colors shrink-0 ml-1"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}