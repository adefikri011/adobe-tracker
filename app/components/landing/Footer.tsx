"use client";

import Link from "next/link";
import TrackStockLogo from "../icons/brand";
import { useState, useEffect } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [landingLogo, setLandingLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    const fetchLandingLogo = async () => {
      try {
        const res = await fetch(`/api/admin/logos/upload?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) { setLandingLogo(null); return; }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) { setLandingLogo(null); return; }

        const payload = await res.json();
        const data = Array.isArray(payload?.data) ? payload.data : [];
        const landingLogoData = data.find((logo: any) => logo.sectionType === "land");

        if (landingLogoData?.fileUrl) {
          console.log("✅ Landing logo found in DB (Footer):", landingLogoData.fileUrl);
          const imageUrl = `${landingLogoData.fileUrl}?v=${Date.now()}`;
          const imgCheck = new Image();
          imgCheck.onload = () => {
            console.log("✅ Landing logo loaded successfully (Footer)");
            setLandingLogo(imageUrl);
          };
          imgCheck.onerror = () => {
            console.error("❌ Landing logo failed to load (Footer) - using default. URL:", imageUrl);
            setLandingLogo(null);
          };
          imgCheck.src = imageUrl;
        } else {
          console.log("ℹ️ No landing logo in database (Footer) - using default SVG");
          setLandingLogo(null);
        }
      } catch {
        setLandingLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchLandingLogo();
  }, []);

  const productLinks = [
    { label: "Features", href: "#features" },
    { label: "Statistics", href: "#stats" },
    { label: "Pricing", href: "/dashboard/billing/plans" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  const companyLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const legalLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
    { label: "License", href: "/license" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#0a0a14] border-t border-white/5">

      {/* Glow blobs — konsisten dengan Pro Banner */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-orange-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 left-[10%] w-[320px] h-[320px] rounded-full bg-pink-600/8 blur-[100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-5">
              {logoLoading ? (
                <div className="w-32 h-10 bg-white/10 rounded-lg animate-pulse" />
              ) : landingLogo ? (
                <img
                  src={landingLogo}
                  alt="Landing Logo"
                  className="w-32 h-auto object-contain object-left drop-shadow-md"
                />
              ) : null}
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-[220px]">
              Real-time analytics and insights designed for Adobe Stock contributors.
            </p>

            {/* Mini stat pills */}
            <div className="mt-5 flex flex-col gap-2">
              {[
                { label: "840K+ Photos indexed" },
                { label: "310K+ Videos tracked" },
              ].map(({ label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 text-[11px] text-white/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 shrink-0" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {[
            { title: "Product", links: productLinks },
            { title: "Company", links: companyLinks },
            { title: "Legal", links: legalLinks },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/35 hover:text-orange-400 transition-colors duration-150 font-light"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-7" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-[11px] font-medium text-center sm:text-left">
            © {currentYear} MetricStock. All rights reserved. Built for Adobe Stock Contributors.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {[
              {
                label: "X",
                href: "#",
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px]">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                  </svg>
                ),
              },
              {
                label: "Facebook",
                href: "#",
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px]">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                ),
              },
              {
                label: "LinkedIn",
                href: "#",
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px]">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                ),
              },
            ].map(({ label, href, icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/35 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/10 transition-all duration-150"
              >
                {icon}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}