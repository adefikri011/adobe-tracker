"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  ShoppingBag, 
  CloudUpload, 
  UserPlus, 
  AlertCircle, 
  Search,
  Clock,
  ChevronRight
} from "lucide-react";

type ActivityType = "Sale" | "Upload" | "User" | "System";

interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  amount?: string;
  status: "success" | "warning" | "error" | "info";
}

const activityData: ActivityLog[] = [
  { id: "1", type: "Sale", title: "New Asset Sold", description: "Landscape Mountain photo has been purchased.", time: "2 mins ago", amount: "+$2.40", status: "success" },
  { id: "2", type: "Upload", title: "Sync Completed", description: "Successfully synced 42 new assets from Adobe Stock.", time: "45 mins ago", status: "info" },
  { id: "3", type: "System", title: "API Connection Timeout", description: "Adobe API is taking longer than usual to respond.", time: "2 hours ago", status: "warning" },
  { id: "4", type: "User", title: "New Member Joined", description: "User @bocahdev has upgraded to Pro Plan.", time: "5 hours ago", status: "success" },
  { id: "5", type: "Sale", title: "Asset Downloaded", description: "Abstract Fluid Art was downloaded via subscription.", time: "1 day ago", amount: "+$0.33", status: "success" },
];

const typeIcons = {
  Sale: <ShoppingBag size={16} />,
  Upload: <CloudUpload size={16} />,
  User: <UserPlus size={16} />,
  System: <AlertCircle size={16} />,
};

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<ActivityType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = useMemo(() => {
    return activityData.filter(log => {
      const matchFilter = activeFilter === "All" || log.type === activeFilter;
      const matchSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [activeFilter, searchTerm]);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-[#FBFCFE] min-h-screen space-y-6 sm:space-y-8 md:space-y-10">
      
      {/* ── Header Section ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1e293b] tracking-tight">Recent Activity</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Keep track of everything happening in TrackStock.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all w-64 font-medium shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            {["All", "Sale", "Upload", "System"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f as any)}
                className={`px-3 sm:px-5 py-1.5 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${
                  activeFilter === f 
                  ? "bg-[#ff6b00] text-white shadow-md shadow-orange-100" 
                  : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activity List ───────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-100/50 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 md:p-6 border-b border-slate-50 bg-white">
          <h3 className="text-sm sm:text-base font-semibold text-[#1e293b]">Activity Timeline</h3>
        </div>

        <div className="divide-y divide-slate-50">
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 md:p-6 gap-3 sm:gap-4 hover:bg-slate-50/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
                  {/* Subtle Icon Box */}
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-100 transition-colors 
                    ${log.status === 'success' ? 'bg-green-50/50 text-green-600' : 
                      log.status === 'warning' ? 'bg-orange-50/50 text-orange-600' : 
                      'bg-blue-50/50 text-blue-600'}`}>
                    {typeIcons[log.type]}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-sm font-semibold text-[#1e293b] group-hover:text-[#ff6b00] transition-colors">
                      {log.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {log.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                  <div className="hidden md:flex flex-col items-end">
                    {log.amount && (
                      <span className="text-sm font-semibold text-green-600 mb-0.5">{log.amount}</span>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                      <Clock size={12} />
                      {log.time}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredLogs.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <p className="text-sm font-medium">No recent activities found.</p>
            </div>
          )}
        </div>

        {/* Load More Section */}
        <div className="p-4 bg-slate-50/30 text-center">
          <button className="text-[10px] font-bold text-slate-400 hover:text-[#ff6b00] uppercase tracking-[0.2em] transition-colors py-2">
            View Older History
          </button>
        </div>
      </div>
    </div>
  );
}