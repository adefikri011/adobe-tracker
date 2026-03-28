"use client";

import Link from "next/link";
import TrackStockLogo from "../icons/brand";


export default function Footer() {
  const currentYear = new Date().getFullYear();

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
            <div className="flex items-center gap-3 mb-3 sm:mb-4"> 

              <TrackStockLogo />

              <div className="flex flex-col">
                <span className="font-[950] text-lg sm:text-xl tracking-tighter text-slate-900 leading-none">
                  Track<span className="text-orange-500">Stock</span>
                </span>
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mt-1">
                  Analytics Pro
                </span>
              </div>
            </div>

            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xs"> {/* Sedikit penyesuaian warna & font-weight agar lebih terbaca */}
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
