"use client";

interface NavbarProps {
  isPro: boolean;
  planLoading: boolean;
  onUpgradeClick: () => void;
  onSignOut: () => void;
}

export function Navbar({ isPro, planLoading, onUpgradeClick, onSignOut }: NavbarProps) {
  return (
    <nav
      className="flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40"
      style={{
        height: "60px",
        background: "rgba(10,10,10,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: "#f97316", boxShadow: "0 0 14px rgba(249,115,22,0.45)" }}
        >
          T
        </div>
        <span className="font-semibold text-[15px] text-white" style={{ letterSpacing: "-0.01em" }}>
          TrackStock
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Free badge */}
        {!isPro && !planLoading && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.25)",
              color: "#fb923c",
              letterSpacing: "0.03em",
            }}
          >
            Free Plan
          </div>
        )}

        {/* Pro badge */}
        {isPro && !planLoading && (
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-[5px] rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#34d399" stroke="#34d399" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-semibold" style={{ color: "#34d399", letterSpacing: "0.03em" }}>
              PRO PLAN
            </span>
          </div>
        )}

        {/* Upgrade button */}
        {!isPro && (
          <button
            onClick={onUpgradeClick}
            disabled={planLoading}
            className="font-semibold rounded-lg transition-all duration-200 disabled:opacity-40 text-white text-[12px] sm:text-[13px] px-3 sm:px-4 py-1.5 sm:py-2"
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: "0 0 18px rgba(249,115,22,0.3)",
            }}
          >
            Upgrade Pro
          </button>
        )}

        <div className="w-px h-[18px] mx-0.5 sm:mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="text-[12px] px-2 py-1.5 transition-colors duration-150"
          style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}