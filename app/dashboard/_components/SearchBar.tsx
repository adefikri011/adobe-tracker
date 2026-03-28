"use client";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  query: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSearch: () => void;
}

const TYPE_FILTERS = ["All Types", "Photo", "Vector", "Video"];
const SORT_FILTERS = ["Relevance", "Most Downloads", "Trending"];

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
  "Travel and adventure scenery"
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

  return (
    <div className="text-center mb-8 sm:mb-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">Adobe Stock Analytics</h1>
      <p className="text-gray-400 text-sm mb-6 sm:mb-8">
        Search any keyword to discover top-performing assets
      </p>

      <div className="flex gap-2 sm:gap-3 max-w-2xl mx-auto">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder=""
            className="w-full bg-white border border-gray-200 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition shadow-sm"
          />

          {/* Typewriter placeholder — hanya tampil saat input kosong */}
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
          onClick={onSearch}
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

      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-orange-400 hover:text-orange-500 transition"
          >
            {f}
          </button>
        ))}
        <span className="text-gray-300 text-xs">|</span>
        {SORT_FILTERS.map((f) => (
          <button
            key={f}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-orange-400 hover:text-orange-500 transition"
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}