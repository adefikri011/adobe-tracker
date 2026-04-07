"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface NavbarProps {
  isPro: boolean;
  planLoading: boolean;
  onUpgradeClick?: () => void;
  onSignOut?: () => void;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
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

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconBilling = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "US";
}

function getPlanBadge(isPro: boolean, planLoading: boolean): { label: string; tone: string; glow: string; dot: string } | null {
  if (planLoading) return null;

  if (isPro) {
    return {
      label: "PRO",
      tone: "rgba(16,185,129,0.12)",
      glow: "rgba(16,185,129,0.18)",
      dot: "#10b981",
    };
  }

  return {
    label: "FREE",
    tone: "rgba(249,115,22,0.10)",
    glow: "rgba(249,115,22,0.18)",
    dot: "#f97316",
  };
}

export function Navbar({ isPro, planLoading, onUpgradeClick, onSignOut, userEmail, userName, userAvatar }: NavbarProps) {
  const supabase = createClient();
  const router = useRouter();
  const [userLogo, setUserLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string; avatar?: string }>({
    email: userEmail,
    name: userName,
    avatar: userAvatar,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user info from supabase if not passed as props
  useEffect(() => {
    const fetchUser = async () => {
      if (!userEmail) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserInfo({
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
            avatar: data.user.user_metadata?.avatar_url,
          });
        }
      }
    };
    fetchUser();
  }, [userEmail]);

  // Fetch user logo
  useEffect(() => {
    const fetchUserLogo = async () => {
      try {
        const res = await fetch(`/api/admin/logos/upload?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) {
          setUserLogo(null);
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          setUserLogo(null);
          return;
        }

        const payload = await res.json();
        const data = Array.isArray(payload?.data) ? payload.data : [];
        const userLogoData = data.find((logo: any) => logo.sectionType === "user");
        if (userLogoData?.fileUrl) {
          const imageUrl = `${userLogoData.fileUrl}?v=${Date.now()}`;
          const imgCheck = new Image();
          imgCheck.onload = () => setUserLogo(imageUrl);
          imgCheck.onerror = () => setUserLogo(null);
          imgCheck.src = imageUrl;
        } else {
          setUserLogo(null);
        }
      } catch {
        setUserLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };
    fetchUserLogo();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleInternalSignOut = async () => {
    setProfileOpen(false);
    try {
      const logoutRes = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (!logoutRes.ok) throw new Error("Logout API failed");
      await supabase.auth.signOut();
      if (onSignOut) onSignOut();
      window.location.href = "/";
    } catch {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const handleRedirectToPlans = () => router.push("/dashboard/billing/plans");

  const initials = getInitials(userInfo.name, userInfo.email);
  const displayName = userInfo.name || userInfo.email?.split("@")[0] || "User";
  const displayEmail = userInfo.email || "";
  const planBadge = getPlanBadge(isPro, planLoading);

  return (
    <>
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
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 z-[110] group">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-2xl group-hover:bg-orange-500/40 transition-all duration-500" />
            {userLogo && !logoLoading ? (
              <img src={userLogo} alt="User Logo" className="w-10 h-10 drop-shadow-sm object-contain" />
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

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Upgrade button */}
          {!isPro && (
            <button
              onClick={handleRedirectToPlans}
              disabled={planLoading}
              className="font-bold rounded-xl transition-all duration-200 disabled:opacity-40 text-white text-[13px] px-3 sm:px-4 py-2 flex items-center gap-1.5"
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
              <span className="hidden sm:inline">Upgrade Pro</span>
              <span className="sm:hidden">Pro</span>
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-5" style={{ background: "rgba(0,0,0,0.1)" }} />

          {/* Profile Avatar Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-150"
              style={{
                background: profileOpen ? "rgba(0,0,0,0.05)" : "transparent",
                border: "1.5px solid",
                borderColor: profileOpen ? "rgba(249,115,22,0.35)" : "rgba(0,0,0,0.08)",
                cursor: "pointer",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!profileOpen) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!profileOpen) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                }
              }}
              aria-label="Profile menu"
            >
              {/* Avatar */}
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                }}
              >
                {userInfo.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span style={{ color: "white", fontSize: "11px", fontWeight: "800", letterSpacing: "0.03em" }}>
                    {initials}
                  </span>
                )}
              </div>

              {/* Name — hidden on small screens */}
              <span
                className="hidden md:block text-[13px] font-semibold max-w-[100px] truncate"
                style={{ color: "rgba(0,0,0,0.75)" }}
              >
                {displayName}
              </span>

              {/* Chevron */}
              <span style={{ color: "rgba(0,0,0,0.35)" }}>
                <IconChevron open={profileOpen} />
              </span>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 mt-2"
                style={{
                  width: "240px",
                  background: "rgba(255,255,255,0.98)",
                  border: "1px solid rgba(0,0,0,0.09)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  overflow: "hidden",
                  zIndex: 999,
                  animation: "dropdownFadeIn 0.15s ease",
                }}
              >
                {/* User info header */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    background: "rgba(249,115,22,0.03)",
                    position: "relative",
                    paddingRight: "84px",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {userInfo.avatar ? (
                        <img
                          src={userInfo.avatar}
                          alt="Avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span style={{ color: "white", fontSize: "13px", fontWeight: "800" }}>{initials}</span>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "rgba(0,0,0,0.85)",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {displayName}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "rgba(0,0,0,0.4)",
                          margin: "2px 0 0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {displayEmail}
                      </p>
                    </div>
                  </div>

                  {planBadge && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 9px",
                        borderRadius: "999px",
                        background: isPro ? "rgba(16,185,129,0.08)" : "rgba(249,115,22,0.08)",
                        border: isPro ? "1px solid rgba(16,185,129,0.18)" : "1px solid rgba(249,115,22,0.18)",
                        zIndex: 2,
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "999px",
                          background: planBadge.dot,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 900,
                          letterSpacing: "0.14em",
                          color: isPro ? "#059669" : "#ea580c",
                        }}
                      >
                        {planBadge.label}
                      </span>
                    </div>
                  )}

                </div>

                {/* Menu items */}
                <div style={{ padding: "6px" }}>
                  <DropdownItem
                    icon={<IconUser />}
                    label="My Profile"
                    onClick={() => { setProfileOpen(false); router.push("/dashboard/profile"); }}
                  />
                  <DropdownItem
                    icon={<IconBilling />}
                    label="Billing & Plans"
                    onClick={() => { setProfileOpen(false); router.push("/dashboard/billing/plans"); }}
                    badge={!isPro ? "Upgrade" : undefined}
                  />
                </div>

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "0 6px" }} />

                {/* Sign out */}
                <div style={{ padding: "6px" }}>
                  <DropdownItem
                    icon={<IconLogout />}
                    label="Sign Out"
                    onClick={handleInternalSignOut}
                    danger
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Dropdown animation keyframe */}
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

// --- Dropdown Item Component ---
interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  badge?: string;
}

function DropdownItem({ icon, label, onClick, danger, badge }: DropdownItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "9px 12px",
        borderRadius: "10px",
        border: "none",
        background: hovered
          ? danger
            ? "rgba(239,68,68,0.06)"
            : "rgba(0,0,0,0.04)"
          : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.12s ease",
        color: danger
          ? hovered ? "#dc2626" : "rgba(220,38,38,0.75)"
          : hovered ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.6)",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
      <span style={{ fontSize: "13px", fontWeight: "600", flex: 1 }}>{label}</span>
      {badge && (
        <span
          style={{
            fontSize: "10px",
            fontWeight: "800",
            color: "#ea580c",
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.2)",
            borderRadius: "6px",
            padding: "2px 7px",
            letterSpacing: "0.03em",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}