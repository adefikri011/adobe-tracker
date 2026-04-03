"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const prevPath = useRef<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevPath.current === null) {
      prevPath.current = pathname;
      return;
    }

    if (prevPath.current !== pathname) {
      prevPath.current = pathname;

      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);

      setFadeOut(false);
      setVisible(true);

      hideTimer.current = setTimeout(() => {
        setFadeOut(true);
        fadeTimer.current = setTimeout(() => setVisible(false), 450);
      }, 700);
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

        .nl-blur-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          backdrop-filter: blur(20px) saturate(0.75);
          -webkit-backdrop-filter: blur(20px) saturate(0.75);
          background: rgba(255, 255, 255, 0.52);
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.45s ease;
        }

        @media (prefers-color-scheme: dark) {
          .nl-blur-overlay {
            background: rgba(10, 10, 10, 0.52);
          }
          .nl-ring-track { stroke: rgba(255,255,255,0.08) !important; }
          .nl-bar-track { background: rgba(255,255,255,0.09) !important; }
        }

        .nl-ring-wrap {
          position: relative;
          width: 56px;
          height: 56px;
          animation: nlFadeUp 0.3s ease both;
        }

        .nl-svg-spin {
          animation: nlSpin 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .nl-center-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e85b3c, #f8a94a);
          animation: nlDotPulse 1.2s ease-in-out infinite;
        }

        .nl-bar-wrap {
          width: 100px;
          height: 1px;
          background: rgba(0, 0, 0, 0.09);
          border-radius: 1px;
          overflow: hidden;
          animation: nlFadeUp 0.3s ease 0.1s both;
        }

        .nl-bar {
          height: 100%;
          background: linear-gradient(90deg, #e85b3c, #f8a94a);
          border-radius: 1px;
          animation: nlBarSlide 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes nlSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes nlDotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,91,60,0.45); }
          50%       { box-shadow: 0 0 0 7px rgba(232,91,60,0); }
        }
        @keyframes nlBarSlide {
          0%   { width: 0%;   margin-left: 0; }
          55%  { width: 65%;  margin-left: 0; }
          100% { width: 0%;   margin-left: 100px; }
        }
        @keyframes nlFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="nl-blur-overlay"
        style={{
          opacity: fadeOut ? 0 : 1,
          pointerEvents: fadeOut ? "none" : "all",
        }}
      >
        <div className="nl-ring-wrap">
          <svg
            className="nl-svg-spin"
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
          >
            <circle
              className="nl-ring-track"
              cx="28"
              cy="28"
              r="22"
              stroke="rgba(0,0,0,0.07)"
              strokeWidth="3"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="url(#nlGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="54 84"
              transform="rotate(-90 28 28)"
            />
            <defs>
              <linearGradient id="nlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e85b3c" />
                <stop offset="100%" stopColor="#f8a94a" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
          <div className="nl-center-dot" />
        </div>

        <div className="nl-bar-wrap nl-bar-track">
          <div className="nl-bar" />
        </div>
      </div>
    </>
  );
}