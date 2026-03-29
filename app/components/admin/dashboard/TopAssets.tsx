"use client";

import { motion } from "framer-motion";
import { Download, ImageIcon, Film, Layers } from "lucide-react";

const assets = [
  { id: "1", title: "Modern Technology Background", downloads: 1240, type: "Photo"  },
  { id: "2", title: "Abstract Business Vector Set",  downloads: 980,  type: "Vector" },
  { id: "3", title: "Nature Landscape Collection",   downloads: 870,  type: "Photo"  },
  { id: "4", title: "Health & Wellness Icons",        downloads: 740,  type: "Vector" },
  { id: "5", title: "Corporate Team Meeting",         downloads: 610,  type: "Video"  },
];

const typeConfig: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  Photo:  { icon: ImageIcon, bg: "bg-blue-50  border-blue-100",   text: "text-blue-500"   },
  Vector: { icon: Layers,    bg: "bg-orange-50 border-orange-100", text: "text-orange-500" },
  Video:  { icon: Film,      bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-500" },
};

export default function TopAssets() {
  return (
    <div className="space-y-2">
      {assets.map((asset, i) => {
        const cfg = typeConfig[asset.type] ?? typeConfig.Photo;
        const Icon = cfg.icon;
        return (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ x: 3 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50/60 transition-colors group cursor-default"
          >
            <div className={`w-9 h-9 rounded-xl ${cfg.bg} border flex items-center justify-center flex-shrink-0`}>
              <Icon size={15} className={cfg.text} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                {asset.title}
              </p>
              <span className={`text-[10px] font-bold ${cfg.text}`}>{asset.type}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold flex-shrink-0">
              <Download size={11} />
              {asset.downloads.toLocaleString()}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}