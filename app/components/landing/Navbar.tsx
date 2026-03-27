"use client";

import { useState, useEffect } from "react";
import { LogIn, ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Efek scroll untuk mengubah tampilan navbar saat di-scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
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
    { id: "reviews", label: "Reviews" },
    { id: "about", label: "About" }
  ];

  const TrackStockLogo = () => (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10 drop-shadow-sm"
    >
      {/* Background Card dengan Gradient Halus */}
      <rect width="40" height="40" rx="12" fill="url(#logo-gradient)" />

      {/* Abstrak 'T' yang terbentuk dari Chart Bar */}
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

      {/* Definitions untuk Gradient */}
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB923C" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
    </svg>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled
          ? "py-3 px-6 md:px-12 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm"
          : "py-5 px-6 md:px-12 bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 z-[110] group">
            <div className="relative">
              {/* Glow effect di belakang logo saat hover */}
              <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-2xl group-hover:bg-orange-500/40 transition-all duration-500" />

              <TrackStockLogo />
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

          {/* DESKTOP NAV LINKS */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSmoothScroll(item.id)}
                className="text-[14px] font-bold text-slate-500 hover:text-orange-600 transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-1 bg-orange-500 rounded-full group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          {/* RIGHT SIDE (Login & CTA) */}
          <div className="flex items-center gap-3 md:gap-8 z-[110]">
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>

            <Link
              href="/register"
              className="flex items-center gap-2 text-sm bg-orange-500 hover:bg-orange-600 transition-all px-4 sm:px-5 py-2.5 rounded-2xl font-black text-white shadow-lg shadow-orange-500/25 active:scale-95"
            >
              <span className="text-[12px] sm:text-[13px]">Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex md:hidden p-2.5 bg-slate-100 rounded-xl text-slate-900 active:scale-90 transition-transform"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU OVERLAY */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 overflow-hidden md:hidden shadow-2xl"
            >
              <div className="flex flex-col p-6 gap-4">
                {navLinks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSmoothScroll(item.id)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 text-left font-black text-slate-900 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    {item.label}
                    <ArrowRight className="w-4 h-4 opacity-30" />
                  </button>
                ))}
                <div className="h-px bg-slate-100 my-2" />
                <Link
                  href="/login"
                  className="p-4 text-center font-bold text-slate-500 bg-slate-50 rounded-2xl"
                  onClick={() => setIsOpen(false)}
                >
                  Already have an account? <span className="text-orange-500">Login</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}