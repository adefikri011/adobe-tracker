"use client";

import Link from "next/link";
import TrackStockLogo from "../icons/brand";
import { useState, useEffect } from "react";


export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [landingLogo, setLandingLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  // Fetch landing logo on mount
  useEffect(() => {
    const fetchLandingLogo = async () => {
      try {
        const res = await fetch(`/api/admin/logos/upload?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setLandingLogo(null);
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          setLandingLogo(null);
          return;
        }

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

  return (
    <footer className="relative border-t border-orange-100/30 bg-gradient-to-b from-white via-orange-50/5 to-white overflow-hidden">
      {/* Continuous Storytelling Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-30%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-orange-200/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[5%] w-[300px] md:w-[450px] h-[300px] md:h-[450px] bg-orange-100/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-5 md:px-6 py-12 sm:py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-10 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col items-start gap-4 mb-4 sm:mb-6">
              {logoLoading ? (
                <div className="w-32 h-16 md:w-36 md:h-[4.5rem] bg-slate-200 rounded-lg animate-pulse" />
              ) : landingLogo ? (
                <img
                  src={landingLogo}
                  alt="Landing Logo"
                  className="w-32 h-16 md:w-36 md:h-[4.5rem] drop-shadow-md object-contain object-left"
                />
              ) : null}
            </div>

            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xs">
              Real-time analytics and insights designed for Adobe Stock contributors.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-xs sm:text-sm">Product</h4>
            <ul className="space-y-1.5 sm:space-y-2.5">
              <li><Link href="#features" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Features</Link></li>
              <li><Link href="#stats" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Statistics</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Dashboard</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-xs sm:text-sm">Company</h4>
            <ul className="space-y-1.5 sm:space-y-2.5">
              <li><Link href="/" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Home</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">About</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Contact</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-xs sm:text-sm">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2.5">
              <li><a href="#" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Terms</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">Cookies</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gray-900 text-xs sm:text-sm transition-colors font-light">License</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
          <p className="text-gray-400 text-[11px] sm:text-xs font-medium text-center md:text-left">
            © {currentYear} TrackStock. All rights reserved. Built for Adobe Stock Contributors.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
              <span className="text-lg">𝕏</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
              <span className="text-lg">f</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
              <span className="text-lg">in</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
