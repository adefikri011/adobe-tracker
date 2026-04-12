"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface NavbarProps {
  isPro: boolean;
  planLoading: boolean;
  onUpgradeClick?: () => void;
  onSignOut?: () => void;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  isGuest?: boolean;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconBilling = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconContributors = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s cubic-bezier(.4,0,.2,1)" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconZap = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="currentColor" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "US";
}

// ─── Dropdown Item ────────────────────────────────────────────────────────────

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
  badge?: string;
}

function DropdownItem({ icon, label, sublabel, onClick, danger, badge }: DropdownItemProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group"
      style={{
        background: hovered ? (danger ? "rgba(239,68,68,0.07)" : "rgba(249,115,22,0.06)") : "transparent",
        border: "none",
        cursor: "pointer",
        color: danger ? (hovered ? "#dc2626" : "rgba(220,38,38,0.7)") : (hovered ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.55)"),
      }}
    >
      <span
        className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-all duration-150"
        style={{
          background: hovered
            ? danger ? "rgba(239,68,68,0.1)" : "rgba(249,115,22,0.12)"
            : "rgba(0,0,0,0.04)",
          color: hovered
            ? danger ? "#dc2626" : "#ea580c"
            : "rgba(0,0,0,0.45)",
        }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-none mb-0.5">{label}</p>
        {sublabel && <p className="text-[11px] opacity-50 leading-none">{sublabel}</p>}
      </div>
      {badge && (
        <span className="text-[10px] font-black tracking-wide px-2 py-0.5 rounded-md"
          style={{ background: "rgba(249,115,22,0.12)", color: "#ea580c", border: "1px solid rgba(249,115,22,0.2)" }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────

export function Navbar({ isPro, planLoading, onUpgradeClick, onSignOut, userEmail, userName, userAvatar, isGuest }: NavbarProps) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname?.() ?? "";
  const [userLogo, setUserLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string; avatar?: string }>({
    email: userEmail,
    name: userName,
    avatar: userAvatar,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect scroll for navbar elevation
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        if (!res.ok) { setUserLogo(null); return; }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) { setUserLogo(null); return; }
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

  // Check if on contributor page
  const isContributorPage = pathname.includes("/contibutor");

  return (
    <>
      <style>{`
        @keyframes navDropdown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1);    }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .nav-upgrade-btn {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #f97316 100%);
          background-size: 200% auto;
          transition: background-position 0.5s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .nav-upgrade-btn:hover {
          background-position: right center;
          box-shadow: 0 8px 28px rgba(249,115,22,0.45) !important;
          transform: translateY(-1px);
        }
        .nav-upgrade-btn:active { transform: translateY(0); }

        .nav-contributors-link {
          position: relative;
          overflow: hidden;
        }
        .nav-contributors-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 50%;
          width: 0; height: 2px;
          background: linear-gradient(90deg, #f97316, #ea580c);
          border-radius: 99px;
          transform: translateX(-50%);
          transition: width 0.25s ease;
        }
        .nav-contributors-link:hover::after,
        .nav-contributors-link.active::after {
          width: calc(100% - 24px);
        }
      `}</style>

      <nav
        style={{
          height: "clamp(56px, 12vw, 64px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(12px, 4vw, 24px)",
          background: scrolled
            ? "rgba(255,255,255,0.98)"
            : "rgba(255,255,255,0.97)",
          borderBottom: scrolled
            ? "1px solid rgba(249,115,22,0.12)"
            : "1px solid rgba(0,0,0,0.07)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: scrolled
            ? "0 4px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(249,115,22,0.08)"
            : "none",
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* ── LEFT: Logo ── */}
        <Link
          href={isGuest ? "/" : "/dashboard"}
          className="flex items-center gap-3 group flex-shrink-0"
          style={{ zIndex: 110 }}
        >
          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"
              style={{ background: "rgba(249,115,22,0.2)" }}
            />
            {!logoLoading && userLogo && (
              <img
                src={userLogo}
                alt="Logo"
                className="relative object-contain object-left"
                style={{
                  width: "clamp(80px, 10vw, 144px)",
                  height: "clamp(32px, 4vw, 64px)",
                  filter: "drop-shadow(0 2px 8px rgba(249,115,22,0.15))",
                  transition: "transform 0.3s ease, filter 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                  (e.currentTarget as HTMLElement).style.filter = "drop-shadow(0 4px 14px rgba(249,115,22,0.3))";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  (e.currentTarget as HTMLElement).style.filter = "drop-shadow(0 2px 8px rgba(249,115,22,0.15))";
                }}
              />
            )}
          </div>
        </Link>

        {/* ── RIGHT: Actions ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px, 2vw, 8px)" }}>

          {/* Page indicator pill — shown when on contributor page */}
          {!isGuest && isContributorPage && (
            <div
              className="hidden md:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold"
              style={{
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.2)",
                color: "#ea580c",
              }}
            >
              <IconContributors />
              <span className="hidden sm:inline">Contributors</span>
            </div>
          )}

          {/* Contributors Link */}
          {!isGuest && (
            <Link
              href="/dashboard/contibutor"
              className={`nav-contributors-link flex items-center gap-1 md:gap-2 px-1.5 md:px-2 lg:px-4 py-1 md:py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-[11px] md:text-[12px] lg:text-[13px] font-semibold transition-all duration-200 ${isContributorPage ? "active" : ""}`}
              style={{
                color: isContributorPage ? "#ea580c" : "rgba(0,0,0,0.6)",
                background: isContributorPage ? "rgba(249,115,22,0.07)" : "transparent",
                border: "1.5px solid",
                borderColor: isContributorPage ? "rgba(249,115,22,0.25)" : "rgba(0,0,0,0.07)",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                if (!isContributorPage) {
                  (e.currentTarget as HTMLElement).style.color = "#ea580c";
                  (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.06)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isContributorPage) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.6)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)";
                }
              }}
            >
              <IconContributors />
              <span className="hidden md:inline">Contributors</span>
            </Link>
          )}

          {/* Upgrade Button */}
          {!isPro && !isGuest && (
            <button
              onClick={handleRedirectToPlans}
              disabled={planLoading}
              className="nav-upgrade-btn flex items-center gap-1 sm:gap-1.5 text-white font-bold rounded-lg lg:rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                padding: "clamp(6px, 2vw, 9px) clamp(10px, 3vw, 16px)",
                fontSize: "clamp(11px, 2vw, 13px)",
                boxShadow: "0 4px 18px rgba(249,115,22,0.35)",
                letterSpacing: "0.01em",
              }}
            >
              <IconZap />
              <span className="hidden sm:inline">Upgrade Pro</span>
              <span className="sm:hidden text-xs">Pro</span>
            </button>
          )}

          {/* Separator */}
          {!isGuest && (
            <div style={{ width: "1px", height: "clamp(14px, 3vw, 22px)", background: "rgba(0,0,0,0.09)", margin: "0 clamp(1px, 1vw, 2px)" }} />
          )}

          {/* Profile Avatar Dropdown */}
          {!isGuest && (
            <div className="relative" ref={dropdownRef}>
              {/* Trigger */}
              <button
                onClick={() => setProfileOpen((p) => !p)}
                aria-label="Profile menu"
                className="flex items-center gap-1 sm:gap-2.5 rounded-lg lg:rounded-xl transition-all duration-150"
                style={{
                  padding: "clamp(4px, 1.5vw, 6px) clamp(6px, 2vw, 10px) clamp(4px, 1.5vw, 6px) clamp(4px, 2vw, 6px)",
                  border: "1.5px solid",
                  borderColor: profileOpen ? "rgba(249,115,22,0.4)" : "rgba(0,0,0,0.08)",
                  background: profileOpen ? "rgba(249,115,22,0.05)" : "transparent",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: profileOpen ? "0 0 0 3px rgba(249,115,22,0.1)" : "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!profileOpen) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.15)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!profileOpen) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                {/* Avatar ring */}
                <div
                  style={{
                    width: "clamp(26px, 5vw, 30px)",
                    height: "clamp(26px, 5vw, 30px)",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 0 0 2px white, 0 0 0 3.5px rgba(249,115,22,0.35)",
                  }}
                >
                  {userInfo.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                    />
                  ) : (
                    <span style={{ color: "white", fontSize: "11px", fontWeight: 800, letterSpacing: "0.03em" }}>
                      {initials}
                    </span>
                  )}
                </div>

                {/* Name */}
                <span
                  className="hidden lg:block text-[11px] lg:text-[13px] font-semibold max-w-[80px] lg:max-w-[96px] truncate"
                  style={{ color: "rgba(0,0,0,0.72)" }}
                >
                  {displayName}
                </span>

                {/* Plan dot */}
                <span
                  style={{
                    width: "clamp(5px, 1.5vw, 7px)",
                    height: "clamp(5px, 1.5vw, 7px)",
                    borderRadius: "50%",
                    background: isPro ? "#10b981" : "#f97316",
                    flexShrink: 0,
                    boxShadow: isPro ? "0 0 0 2px rgba(16,185,129,0.2)" : "0 0 0 2px rgba(249,115,22,0.2)",
                  }}
                />

                <span style={{ color: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconChevron open={profileOpen} />
                </span>
              </button>

              {/* ── Dropdown Panel ── */}
              {profileOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 10px)",
                    width: "clamp(224px, 90vw, 256px)",
                    background: "rgba(255,255,255,0.99)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "18px",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(249,115,22,0.06)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    overflow: "hidden",
                    zIndex: 999,
                    animation: "navDropdown 0.2s cubic-bezier(.16,1,.3,1) forwards",
                  }}
                >
                  {/* User header */}
                  <div
                    style={{
                      padding: "clamp(12px, 2vh, 16px)",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      background: "linear-gradient(135deg, rgba(249,115,22,0.04) 0%, rgba(255,255,255,0) 100%)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 12px)" }}>
                      {/* Big avatar */}
                      <div
                        style={{
                          width: "clamp(36px, 8vw, 42px)",
                          height: "clamp(36px, 8vw, 42px)",
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "linear-gradient(135deg, #f97316, #ea580c)",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 0 2.5px white, 0 0 0 4px rgba(249,115,22,0.25)",
                        }}
                      >
                        {userInfo.avatar ? (
                          <img
                            src={userInfo.avatar}
                            alt="Avatar"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                          />
                        ) : (
                          <span style={{ color: "white", fontSize: "clamp(12px, 2vw, 14px)", fontWeight: 800 }}>{initials}</span>
                        )}
                      </div>

                      {/* Name + email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "rgba(0,0,0,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {displayName}
                        </p>
                        <p style={{ margin: "3px 0 0", fontSize: "11px", color: "rgba(0,0,0,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {displayEmail}
                        </p>
                      </div>

                      {/* Plan badge */}
                      {!planLoading && (
                        <div
                          style={{
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 9px",
                            borderRadius: "999px",
                            background: isPro ? "rgba(16,185,129,0.09)" : "rgba(249,115,22,0.09)",
                            border: isPro ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(249,115,22,0.2)",
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: isPro ? "#10b981" : "#f97316", flexShrink: 0 }} />
                          <span style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.14em", color: isPro ? "#059669" : "#ea580c" }}>
                            {isPro ? "PRO" : "FREE"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: "clamp(6px, 1.5vh, 8px)" }}>
                    <DropdownItem icon={<IconUser />} label="My Profile" sublabel="View your account" onClick={() => { setProfileOpen(false); router.push("/dashboard/profile"); }} />
                    <DropdownItem icon={<IconBilling />} label="Billing & Plans" sublabel={isPro ? "Manage subscription" : "Upgrade for more"} onClick={() => { setProfileOpen(false); router.push("/dashboard/billing/plans"); }} badge={!isPro ? "Upgrade" : undefined} />
                  </div>

                  {/* Divider */}
                  <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "0 8px" }} />

                  {/* Sign out */}
                  <div style={{ padding: "8px" }}>
                    <DropdownItem icon={<IconLogout />} label="Sign Out" sublabel="See you next time" onClick={handleInternalSignOut} danger />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}