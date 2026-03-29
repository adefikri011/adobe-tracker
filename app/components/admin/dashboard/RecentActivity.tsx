"use client";

import { motion } from "framer-motion";
import { UserPlus, Download, AlertCircle, ShieldCheck, RefreshCw } from "lucide-react";

type ActivityType = "new_user" | "download" | "error" | "admin" | "sync";

const activities = [
  { id: "1", type: "new_user" as ActivityType,  message: "New user registered: john@example.com",          time: "2 min ago"   },
  { id: "2", type: "download" as ActivityType,  message: "Asset #1042 was downloaded 12 times today",      time: "15 min ago"  },
  { id: "3", type: "error"    as ActivityType,  message: "Adobe Stock API rate limit reached",               time: "32 min ago"  },
  { id: "4", type: "admin"    as ActivityType,  message: "Admin upgraded jane@example.com to Pro",           time: "1 hour ago"  },
  { id: "5", type: "sync"     as ActivityType,  message: "Auto-sync completed: 756 assets updated",          time: "2 hours ago" },
  { id: "6", type: "new_user" as ActivityType,  message: "New user registered: alice@example.com",           time: "3 hours ago" },
];

const iconMap: Record<ActivityType, { icon: React.ElementType; bg: string; color: string; ring: string }> = {
  new_user: { icon: UserPlus,    bg: "bg-blue-50",     color: "text-blue-500",    ring: "ring-blue-100"    },
  download:  { icon: Download,   bg: "bg-emerald-50",  color: "text-emerald-500", ring: "ring-emerald-100" },
  error:     { icon: AlertCircle,bg: "bg-red-50",      color: "text-red-500",     ring: "ring-red-100"     },
  admin:     { icon: ShieldCheck,bg: "bg-orange-50",   color: "text-orange-500",  ring: "ring-orange-100"  },
  sync:      { icon: RefreshCw,  bg: "bg-slate-50",    color: "text-slate-400",   ring: "ring-slate-100"   },
};

export default function RecentActivity() {
  return (
    <div className="divide-y divide-slate-50">
      {activities.map((item, i) => {
        const { icon: Icon, bg, color, ring } = iconMap[item.type];
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0 group"
          >
            <div className={`w-8 h-8 rounded-xl ${bg} ring-1 ${ring} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
              <Icon size={14} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-600 leading-snug">{item.message}</p>
            </div>
            <span className="text-[11px] text-slate-300 font-medium flex-shrink-0 mt-0.5 whitespace-nowrap">
              {item.time}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}