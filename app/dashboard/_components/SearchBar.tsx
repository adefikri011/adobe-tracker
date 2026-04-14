"use client";
import { useState, useEffect, useRef } from "react";
import { X, Clock, Search, Trash2 } from "lucide-react";
import { ModernSelect } from "./ModernSelect";

interface SearchBarProps {
  query: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSearch: () => void;
  sortBy?: string;
  onSortByChange?: (v: string) => void;
  contentType?: string;
  onContentTypeChange?: (v: string) => void;
  activeTags?: string[];
  onRemoveTag?: (tag: string) => void;
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

const sortByOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "most-downloaded", label: "Most Downloaded" },
  { value: "undiscovered", label: "Undiscovered" },
];

const contentTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "image", label: "Image" },
  { value: "illustration", label: "Illustration" },
  { value: "vector", label: "Vector" },
  { value: "video", label: "Video" },
  { value: "template", label: "Template" },
  { value: "3d", label: "3D" },
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

export function SearchBar({ 
  query, 
  loading, 
  onChange, 
  onSearch,
  sortBy = "relevance",
  onSortByChange,
  contentType = "all",
  onContentTypeChange,
  activeTags = [],
  onRemoveTag,
}: SearchBarProps) {
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
    <div className="text-center mb-6 sm:mb-8 md:mb-10">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-gray-900">
        Adobe Stock Analytics
      </h1>
      <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 md:mb-8">
        Search any keyword to discover top-performing assets
      </p>

      {/* Search Input with Filters and Button - Main Row */}
      <div className="flex gap-2 sm:gap-3 items-center max-w-4xl mx-auto px-4 sm:px-0">
        {/* Search Container */}
        <div className="flex-1 flex bg-white border border-orange-400 rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
          {/* Search Icon */}
          <Search size={16} className="text-gray-400 ml-3 sm:ml-4 flex-shrink-0 my-auto" />
          
          {/* Input */}
          <div className="relative flex-1 min-h-0">
            <input
              type="text"
              value={query}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder=""
              className="w-full bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900 focus:outline-none"
            />
            {!query && (
              <div
                className="absolute inset-0 flex items-center px-3 sm:px-4 pointer-events-none select-none"
                aria-hidden="true"
              >
                <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap overflow-hidden">
                  {placeholder}
                  <span
                    className="inline-block w-[1.5px] h-[13px] bg-orange-400 ml-[2px] align-middle"
                    style={{ animation: "tsbar-blink 1s step-end infinite" }}
                  />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sort By Dropdown */}
        <ModernSelect
          value={sortBy}
          onValueChange={(value) => onSortByChange?.(value)}
          options={sortByOptions}
          placeholder="Relevance"
        />

        {/* Content Type Dropdown */}
        <ModernSelect
          value={contentType}
          onValueChange={(value) => onContentTypeChange?.(value)}
          options={contentTypeOptions}
          placeholder="All Types"
        />

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-shrink-0 text-white whitespace-nowrap h-full"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="hidden sm:inline">Searching...</span>
            </>
          ) : (
            <>
              <Search size={14} />
              <span className="hidden sm:inline">Search</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes tsbar-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Recent Searches & Active Tags */}
      {(recentSearches.length > 0 || activeTags.length > 0) && (
        <div className="mt-3 sm:mt-4 max-w-4xl mx-auto px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {/* Label */}
            {recentSearches.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Clock size={12} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                  Recent
                </span>
                <span className="text-xs text-gray-300 font-medium">
                  ({recentSearches.length})
                </span>
              </div>
            )}

            {/* All Tags - Recent Searches + Active Filters */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {/* Recent Searches */}
              {recentSearches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => handleRecentClick(search.query)}
                  className="group flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all duration-150 text-left"
                >
                  <span className="text-xs text-gray-600 font-medium group-hover:text-orange-700 transition-colors truncate">
                    {search.query}
                  </span>
                  <X
                    size={12}
                    className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                    onClick={(e) => handleDeleteOne(e as any, search.id)}
                  />
                </button>
              ))}

              {/* Active Filter Tags */}
              {activeTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onRemoveTag?.(tag)}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-50 transition text-xs text-gray-700"
                >
                  <span>{tag}</span>
                  <X size={12} className="text-gray-400 hover:text-gray-600" />
                </button>
              ))}
            </div>

            {/* Clear All */}
            {(recentSearches.length > 0 || activeTags.length > 0) && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium transition-colors shrink-0 justify-center sm:justify-end"
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}