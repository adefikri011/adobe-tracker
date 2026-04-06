"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link"; // Pastikan import link benar
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface NavbarProps {
  isPro: boolean;
  planLoading: boolean;
  onUpgradeClick?: () => void; // Dibuat opsional karena kita pakai router internal
  onSignOut?: () => void;
}

const TrackStockLogo = () => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-10 h-10 drop-shadow-sm"
  >
    <rect width="40" height="40" rx="12" fill="url(#logo-gradient)" />
    <path
      d="M12 22C12 20.8954 12.8954 20 14 20H18V28C18 29.1046 17.1046 30 16 30H14C12.8954 30 12 29.1046 12 28V22Z"
      fill="white"
    />
    <path
      d="M22 16C22 14.8954 22.8954 14 24 14H26C27.1046 14 28 14.8954 28 16V28C28 29.1046 27.1046 30 26 30H24C22.8954 30 22 29.1046 22 28V16Z"
      fill="white"
      fillOpacity="0.6"
    />
    <path
      d="M10 12C10 10.8954 10.8954 10 12 10H28C29.1046 10 30 10.8954 30 12V14C30 15.1046 29.1046 16 28 16H12C10.8954 16 10 15.1046 10 14V12Z"
      fill="white"
    />
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FB923C" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
  </svg>
);

export function Navbar({ isPro, planLoading, onUpgradeClick, onSignOut }: NavbarProps) {
  const supabase = createClient();
  const router = useRouter();
  const [userLogo, setUserLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  // Fetch user logo on mount
  useEffect(() => {
    const fetchUserLogo = async () => {
      try {
        // Add cache busting with timestamp
        const res = await fetch(`/api/admin/logos/upload?t=${Date.now()}`, {
          cache: "no-store",
        });
        const { data } = await res.json();
        
        const userLogoData = data.find((logo: any) => logo.sectionType === "user");
        
        if (userLogoData?.fileUrl) {
          console.log("✅ User logo found in DB:", userLogoData.fileUrl);
          
          // Add timestamp to force image reload
          const imageUrl = `${userLogoData.fileUrl}?v=${Date.now()}`;
          
          // Pre-check if image exists before setting
          const imgCheck = new Image();
          imgCheck.onload = () => {
            console.log("✅ User logo loaded successfully");
            setUserLogo(imageUrl);
          };
          imgCheck.onerror = () => {
            console.error("❌ User logo failed to load - using default. URL:", imageUrl);
            setUserLogo(null);
          };
          imgCheck.src = imageUrl;
        } else {
          console.log("ℹ️ No user logo in database - using default SVG");
          setUserLogo(null);
        }
      } catch (error) {
        console.error("❌ Failed to fetch user logos from API:", error);
        setUserLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchUserLogo();
  }, []);

  // --- LOGIC LOGOUT FIX (API + SUPABASE) ---
  const handleInternalSignOut = async () => {
    try {
      const logoutRes = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!logoutRes.ok) {
        throw new Error("Logout API failed");
      }

      await supabase.auth.signOut();
      if (onSignOut) onSignOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const handleRedirectToPlans = () => {
    router.push("/dashboard/billing/plans");
  };

  return (
    <nav
      className="flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40"
      style={{
        height: "60px",
        background: "rgba(255,255,255,0.97)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <Link href="/dashboard" className="flex items-center gap-3 z-[110] group">
        <div className="relative">
          <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-2xl group-hover:bg-orange-500/40 transition-all duration-500" />
          {userLogo && !logoLoading ? (
            <img
              src={userLogo}
              alt="User Logo"
              className="w-10 h-10 drop-shadow-sm object-contain"
            />
          ) : (
            <TrackStockLogo />
          )}
        </div>

        <div className="flex flex-col">
          <span className="font-[950] text-xl md:text-2xl tracking-tighter text-slate-900 leading-none">
            Track<span className="text-orange-500">Stock</span>
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mt-1">
            Analytics Pro
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {/* Free badge */}
        {!isPro && !planLoading && (
          <div
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold"
            style={{
              background: "rgba(249,115,22,0.08)",
              border: "1.5px solid rgba(249,115,22,0.2)",
              color: "#ea580c",
              letterSpacing: "0.02em",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ea580c" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Free Plan
          </div>
        )}

        {/* Pro badge */}
        {isPro && !planLoading && (
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.07))",
              border: "1.5px solid rgba(16,185,129,0.3)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <polygon
                points="13,2 3,14 12,14 11,22 21,10 12,10"
                fill="#10b981"
                stroke="#10b981"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-[12px] font-bold"
              style={{ color: "#10b981", letterSpacing: "0.04em" }}
            >
              PRO PLAN
            </span>
          </div>
        )}

        {/* Upgrade button - SEKARANG REDIRECT */}
        {!isPro && (
          <button
            onClick={handleRedirectToPlans}
            disabled={planLoading}
            className="font-bold rounded-xl transition-all duration-200 disabled:opacity-40 text-white text-[13px] px-4 py-2 flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: "0 4px 18px rgba(249,115,22,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(249,115,22,0.5)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(249,115,22,0.35)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="white" strokeWidth="0" />
            </svg>
            Upgrade Pro
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-5" style={{ background: "rgba(0,0,0,0.1)" }} />

        {/* Sign out */}
        <button
          onClick={handleInternalSignOut}
          className="text-[12px] font-semibold px-3 py-2 rounded-xl transition-all duration-150"
          style={{
            color: "rgba(0,0,0,0.35)",
            background: "none",
            border: "none",
            cursor: "pointer",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.7)";
            (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.35)";
            (e.currentTarget as HTMLElement).style.background = "none";
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}