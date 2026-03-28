"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, SearchCheck, Rocket, ArrowDown } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    label: "Get Started",
    title: "Create your free account",
    desc: "Sign up in under 30 seconds. No credit card required. Connect your Adobe Stock contributor profile and you're in.",
    highlight: "30 seconds",
    side: "left",
  },
  {
    number: "02",
    icon: SearchCheck,
    label: "Explore Data",
    title: "Analyze your entire portfolio",
    desc: "Search by keyword, title, or asset ID. Get real download numbers, revenue breakdowns, and live market trend data — all in one place.",
    highlight: "Real data",
    side: "right",
  },
  {
    number: "03",
    icon: Rocket,
    label: "Grow Revenue",
    title: "Create smarter, scale faster",
    desc: "Use real insights to produce content that actually sells. Stop guessing — let data guide every upload decision you make.",
    highlight: "Data-driven",
    side: "left",
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

        {/* ── Timeline ── */}
        <div ref={ref} className="relative">

          {/* Center vertical line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-orange-200 via-slate-200 to-transparent hidden md:block" />

          <div className="flex flex-col gap-2 md:gap-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLeft = step.side === "left";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 32 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.75, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative flex items-stretch md:items-center gap-4 sm:gap-6 md:gap-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} flex-col`}
                >
                  {/* Content side */}
                  <div className={`flex-1 py-6 sm:py-8 md:py-14 px-3 sm:px-0 ${isLeft ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left"} text-center md:text-left`}>
                    
                    {/* Step label + number */}
                    <div className={`flex items-center gap-3 mb-3 sm:mb-4 ${isLeft ? "md:justify-end" : "md:justify-start"} justify-center`}>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-1.5 rounded-full">
                        {step.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-[900] text-slate-900 tracking-tight leading-tight mb-2 sm:mb-3">
                      {step.title}
                    </h3>

                    {/* Desc */}
                    <p className="text-slate-500 text-xs sm:text-sm md:text-base leading-relaxed font-medium max-w-full md:max-w-none">
                      {step.desc}
                    </p>

                    {/* Highlight pill */}
                    <div className={`mt-4 sm:mt-5 flex md:inline-flex justify-center items-center gap-2 ${isLeft ? "md:float-right" : ""}`}>
                      <span className="text-[10px] sm:text-xs font-black text-slate-900 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                        ✦ {step.highlight}
                      </span>
                    </div>
                  </div>

                  {/* Center node */}
                  <div className="relative z-10 flex-shrink-0 hidden md:flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/10 border-4 border-white relative">
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                      {/* Number badge */}
                      <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                        {i + 1}
                      </span>
                    </div>
                    {/* Arrow down between steps */}
                    {i < steps.length - 1 && (
                      <div className="mt-2 text-slate-200">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Mobile icon (visible only on mobile) */}
                  <div className="md:hidden flex items-center gap-3 sm:gap-4 mb-1 justify-center w-full flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg relative flex-shrink-0">
                      <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-white" strokeWidth={2.5} />
                      <span className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-500 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-md">
                        {i + 1}
                      </span>
                    </div>
                    <span className="text-4xl sm:text-5xl font-[950] text-slate-100 tracking-tighter leading-none select-none">
                      {step.number}
                    </span>
                  </div>

                  {/* Empty spacer for the other side */}
                  <div className="flex-1 hidden md:block" />

                </motion.div>
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