"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Keyword {
  keyword: string;
  downloads: number;
  rank: number;
}

const rankColor = ["text-orange-500", "text-orange-400", "text-orange-300"];

export default function TopKeywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/top-keywords');
        if (res.ok) {
          const data = await res.json();
          setKeywords(data.keywords);
        }
      } catch (error) {
        console.error('Failed to fetch keywords:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKeywords();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse h-8 bg-slate-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (keywords.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">No keywords data yet</p>;
  }

  const max = keywords[0]?.downloads || 1;

  return (
    <div className="space-y-4">
      {keywords.map((item, i) => (
        <motion.div
          key={item.keyword}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="flex items-center gap-3 group"
        >
          <span className={`w-5 text-xs font-bold text-right flex-shrink-0 ${rankColor[i] ?? "text-slate-300"}`}>
            {item.rank}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700 capitalize">{item.keyword}</span>
              <span className="text-xs text-slate-400 font-medium">{item.downloads.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-orange-50 rounded-full overflow-hidden border border-orange-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.downloads / max) * 100}%` }}
                transition={{ delay: i * 0.08 + 0.2, duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, #fb923c, #f97316)`,
                  opacity: 1 - i * 0.1,
                }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}