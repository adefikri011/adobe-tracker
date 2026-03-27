"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <motion.section
      id="about"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
      className="mx-6 mb-20 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-10 py-16 text-center max-w-4xl lg:mx-auto relative overflow-hidden"
    >
      {/* Continuous Storytelling Background */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-orange-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-[120px]" />
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-orange-500/20 blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10"
      >
        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-4">Ready to start?</p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
          Grow your Adobe Stock<br />business today.
        </h2>
        <p className="text-gray-400 mb-10 font-light max-w-sm mx-auto leading-relaxed">
          Join thousands of contributors already using TrackStock to maximize their earnings.
        </p>
        <Link
          href="/register"
          className="inline-block bg-orange-500 hover:bg-orange-400 transition-colors px-10 py-4 rounded-xl font-bold text-white text-sm shadow-lg shadow-orange-500/30 hover:-translate-y-1 transform duration-200"
        >
          Get Started Free →
        </Link>
      </motion.div>
    </motion.section>
  );
}
