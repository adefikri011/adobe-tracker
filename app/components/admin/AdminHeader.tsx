"use client";

import { Bell, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-16 bg-white border-b border-orange-50 flex items-center justify-between px-6 flex-shrink-0 shadow-[0_2px_12px_0_rgba(249,115,22,0.04)]"
    >
      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 w-64 group focus-within:border-orange-200 focus-within:bg-white transition-all">
        <Search size={14} className="text-slate-300 group-focus-within:text-orange-400 transition-colors" />
        <input
          type="text"
          placeholder="Cari sesuatu..."
          className="bg-transparent text-sm text-slate-600 placeholder-slate-300 outline-none flex-1"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notif bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:border-orange-200 hover:text-orange-500 transition-all"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
        </motion.button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-orange-200">
            A
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-700 leading-tight">Admin</p>
            <p className="text-[10px] text-slate-400">Super Admin</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}