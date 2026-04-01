"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, SearchCheck, Rocket, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    label: "Get Started",
    title: "Create your free account",
    desc: "Sign up in under 30 seconds. No credit card required. Connect your Adobe Stock contributor profile and you're in.",
    highlight: "30 seconds",
  },
  {
    number: "02",
    icon: SearchCheck,
    label: "Explore Data",
    title: "Analyze your entire portfolio",
    desc: "Search by keyword, title, or asset ID. Get real download numbers, revenue breakdowns, and live market trend data — all in one place.",
    highlight: "Real data",
  },
  {
    number: "03",
    icon: Rocket,
    label: "Grow Revenue",
    title: "Create smarter, scale faster",
    desc: "Use real insights to produce content that actually sells. Stop guessing — let data guide every upload decision you make.",
    highlight: "Data-driven",
  },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="process" className="relative py-10 md:py-14 bg-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-orange-50/10 to-white" />

      <div className="max-w-5xl mx-auto px-4 sm:px-5 md:px-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center gap-6 md:gap-8 mb-12 sm:mb-16 md:mb-20"
        >
          <div className="text-center">
            <span className="inline-block px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 sm:mb-5">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-[950] tracking-tighter text-slate-900 leading-[1.05] sm:leading-[0.95]">
              Real results in<br />
              <span className="text-orange-500">3 simple steps.</span>
            </h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base font-medium max-w-sm md:max-w-2xl leading-relaxed text-center">
            From signup to actionable insights — the fastest path to growing your Adobe Stock income.
          </p>
        </motion.div>

        {/* ── Steps Row ── */}
        <div ref={ref} className="relative">
          <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-0">
            {steps.map((step, i) => {
              const Icon = step.icon;

              return (
                <div key={i} className="flex flex-col md:flex-row items-stretch flex-1">

                  {/* ── Card ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.75, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 flex flex-col items-center text-center px-4 sm:px-6 py-6 sm:py-8"
                  >
                    {/* Icon */}
                    <div className="relative mb-4 sm:mb-5">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/10 border-4 border-white">
                        <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                        {i + 1}
                      </span>
                    </div>

                    {/* Label */}
                    <span className="inline-block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-1.5 rounded-full mb-3 sm:mb-4">
                      {step.label}
                    </span>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-[900] text-slate-900 tracking-tight leading-tight mb-2 sm:mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium mb-4 sm:mb-5">
                      {step.desc}
                    </p>

                    {/* Highlight pill */}
                    <span className="mt-auto text-[10px] sm:text-xs font-black text-slate-900 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                      ✦ {step.highlight}
                    </span>
                  </motion.div>

                  {/* ── Connector Arrow (between steps, desktop only) ── */}
                  {i < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ duration: 0.5, delay: i * 0.18 + 0.3 }}
                      className="hidden md:flex items-center justify-center flex-shrink-0 w-10 self-center"
                    >
                      <div className="relative w-full flex items-center">
                        <div className="w-full h-px bg-gradient-to-r from-orange-200 to-orange-300" />
                        <ArrowRight className="absolute -right-1 w-4 h-4 text-orange-300 flex-shrink-0" />
                      </div>
                    </motion.div>
                  )}

                  {/* ── Mobile Divider (between steps, mobile only) ── */}
                  {i < steps.length - 1 && (
                    <div className="md:hidden flex justify-center py-1">
                      <div className="w-px h-8 bg-gradient-to-b from-orange-200 to-orange-100" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 sm:mt-16 md:mt-20 text-center"
        >
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            Ready to get started?{" "}
            <a href="/register" className="text-orange-500 font-black hover:underline underline-offset-2 transition-all">
              Create your free account →
            </a>
          </p>
        </motion.div>

      </div>
    </section>
  );
}