"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 600);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f0f",
        transition: "opacity 0.6s ease",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "all",
      }}
    >
      {/* Ambient glow blob */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,91,60,0.15) 0%, transparent 70%)",
          animation: "pulse 3s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Ring loader */}
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          style={{ animation: "spin 1.4s linear infinite" }}
        >
          {/* Track ring */}
          <circle
            cx="36"
            cy="36"
            r="28"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="5"
          />
          {/* Animated arc */}
          <circle
            cx="36"
            cy="36"
            r="28"
            stroke="url(#arcGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="88 88"
            strokeDashoffset="22"
            transform="rotate(-90 36 36)"
          />
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e85b3c" />
              <stop offset="100%" stopColor="#f8a94a" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e85b3c, #f8a94a)",
            boxShadow: "0 0 12px rgba(232,91,60,0.7)",
          }}
        />
      </div>

      {/* Brand name */}
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
            animation: "fadeInUp 0.6s ease 0.3s both",
          }}
        >
          TrackStock
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}