"use client";

import { useState, useEffect } from "react";
import { LogIn, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [landingLogo, setLandingLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  // Efek untuk menangani Hydration Error, Scroll & Logo Fetch
  useEffect(() => {
    setMounted(true);

    // Scroll handler
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Fetch landing logo
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
          console.log("✅ Landing logo found in DB:", landingLogoData.fileUrl);

          const imageUrl = `${landingLogoData.fileUrl}?v=${Date.now()}`;

          const imgCheck = new Image();
          imgCheck.onload = () => {
            console.log("✅ Landing logo loaded successfully");
            setLandingLogo(imageUrl);
          };
          imgCheck.onerror = () => {
            console.error("❌ Landing logo failed to load - using default. URL:", imageUrl);
            setLandingLogo(null);
          };
          imgCheck.src = imageUrl;
        } else {
          console.log("ℹ️ No landing logo in database - using default SVG");
          setLandingLogo(null);
        }
      } catch {
        setLandingLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchLandingLogo();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSmoothScroll = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navLinks = [
    { id: "features", label: "Features" },
    { id: "process", label: "Process" },
    { id: "reviews", label: "Reviews" },
    { id: "about", label: "About" }
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled
          ? "py-2 px-4 sm:px-6 md:px-8 lg:px-12 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm"
          : "py-3 px-4 sm:px-6 md:px-8 lg:px-12 bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* LOGO */}
          <button onClick={() => handleSmoothScroll("hero")} className="flex items-center z-[110] group cursor-pointer flex-shrink-0">
            <div className="relative flex-shrink-0">
              {/* Glow */}
              <div className="absolute inset-0 bg-orange-500/25 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150" />

              {logoLoading ? (
                <div className="w-32 h-16 md:w-36 md:h-[4.5rem] bg-slate-200 rounded-lg animate-pulse" />
              ) : landingLogo ? (
                <img
                  src={landingLogo}
                  alt="Landing Logo"
                  className="relative w-32 h-16 md:w-36 md:h-[4.5rem] drop-shadow-md object-contain object-left transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
            </div>
          </button>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-10 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSmoothScroll(item.id)}
                className="text-[12px] lg:text-[14px] font-bold text-slate-500 hover:text-orange-600 transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-1 bg-orange-500 rounded-full group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          {/* RIGHT SIDE (Login & CTA) */}
          <div className="flex items-center gap-2 md:gap-3 lg:gap-8 z-[110]">
            <Link
              href="/login"
              className="hidden lg:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors">
              <LogIn className="w-4 h-4" />
              Login
            </Link>

            <Link
              href="/register"
              className="hidden lg:flex items-center gap-2 text-sm bg-orange-500 hover:bg-orange-600 transition-all px-4 sm:px-5 py-2.5 rounded-2xl font-black text-white shadow-lg shadow-orange-500/25 active:scale-95">
              <span className="text-[12px] sm:text-[13px]">Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex lg:hidden p-2 md:p-2.5 bg-slate-100 rounded-xl text-slate-900 active:scale-90 transition-transform items-center justify-center"
            >
              {isOpen ? (
                <X size={20} className="text-slate-600" />
              ) : (
                <img
                  src="/icons/hamburger.svg"
                  alt="Menu"
                  className="w-6 h-6 object-contain"
                />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE/TABLET MENU OVERLAY */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop Blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] lg:hidden"
              />

              {/* Menu Slide */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-14 md:top-16 left-0 right-0 mx-4 max-w-7xl lg:hidden bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl z-[100]"
              >
                <div className="flex flex-col p-6 gap-4">
                  {navLinks.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSmoothScroll(item.id)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 text-left font-black text-slate-900 hover:bg-orange-50 hover:text-orange-600 transition-all cursor-pointer"
                    >
                      {item.label}
                      <ArrowRight className="w-4 h-4 opacity-30" />
                    </button>
                  ))}
                  <div className="h-px bg-slate-100 my-2" />
                  <Link
                    href="/login"
                    className="p-4 text-center font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    Already have an account? <span className="text-orange-500">Login</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = "/register";
                    }}
                    className="p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-center flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}