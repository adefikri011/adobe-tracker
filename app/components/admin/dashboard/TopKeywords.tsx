"use client";

import { motion } from "framer-motion";

const keywords = [
  { keyword: "technology", downloads: 6820, rank: 1 },
  { keyword: "nature",     downloads: 5340, rank: 2 },
  { keyword: "business",   downloads: 4210, rank: 3 },
  { keyword: "health",     downloads: 3780, rank: 4 },
  { keyword: "abstract",   downloads: 2960, rank: 5 },
  { keyword: "food",       downloads: 2410, rank: 6 },
];

const max = keywords[0].downloads;

const rankColor = ["text-orange-500", "text-orange-400", "text-orange-300"];

export default function TopKeywords() {
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