"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Search } from "lucide-react";
import { motion } from "framer-motion";

type AdminHeaderProps = {
  profile: {
    fullName: string;
    email: string | null;
    role: "admin" | "user";
  };
};

export default function AdminHeader({ profile }: AdminHeaderProps) {
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    return profile.fullName?.trim() || profile.email || "Admin";
  }, [profile.fullName, profile.email]);

  const roleLabel = profile.role === "admin" ? "Admin" : "User";
  const avatarLetter = (displayName?.charAt(0) || "A").toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleInternalSignOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const logoutRes = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!logoutRes.ok) {
        throw new Error("Logout API failed");
      }

      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

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

        {/* Profile + dropdown logout */}
        <div ref={menuRef} className="relative pl-3 border-l border-slate-100">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-slate-50 transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-orange-200">
              {avatarLetter}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-700 leading-tight max-w-[130px] truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400">{roleLabel}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[220px] rounded-xl border border-slate-100 bg-white shadow-lg p-2">
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold text-slate-700 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{profile.email || "No email"}</p>
              </div>
              <div className="h-px bg-slate-100 my-1" />
              <button
                type="button"
                onClick={handleInternalSignOut}
                disabled={loggingOut}
                className="w-full text-left px-2 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-60"
              >
                {loggingOut ? "Signing out..." : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}