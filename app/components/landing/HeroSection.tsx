"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Star } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-52 md:pb-32 overflow-hidden bg-white">
      {/* Continuous Storytelling Background - Modern Flow */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-orange-50/20 to-white" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-[100px] -z-10 opacity-80" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-6 text-center">
        
        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="text-4xl sm:text-5xl md:text-7xl lg:text-[80px] font-[900] leading-[1.1] md:leading-[0.95] tracking-tighter mb-6 md:mb-8"
        >
          <span className="text-slate-900">Track Your Adobe Stock</span>
          <br />
          <span className="text-orange-500 inline-block">Performance.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="text-slate-500 text-lg md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed font-medium px-4"
        >
          Understand your earnings like never before. Advanced tracking for serious Adobe Stock contributors who want to sell more.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/register"
            className="group relative flex items-center justify-center gap-2 w-full sm:w-auto bg-orange-500 px-8 py-4 rounded-2xl font-black text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Start for Free Now</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center w-full sm:w-auto bg-white px-8 py-4 rounded-2xl font-bold text-slate-700 border border-slate-200 hover:border-orange-200 hover:text-orange-600 transition-all shadow-sm"
          >
            Upgrade to Pro
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={fadeUp}
          custom={4}
          initial="hidden"
          animate="show"
          className="mt-14 md:mt-16 flex flex-col items-center gap-3"
        >
          <div className="flex items-center -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <img 
                key={i} 
                src={`https://i.pravatar.cc/100?img=${i+10}`} 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-orange-100"
                alt="user"
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <div className="flex text-orange-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
            </div>
            <span>Trusted by 10k+ creators</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}