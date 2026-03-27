"use client";

import { motion } from "framer-motion";

export default function StatsSection() {
  const stats = [
    { label: "Assets Tracked", value: "2.4M+", desc: "Real-time updates" },
    { label: "Contributors", value: "18K+", desc: "Global community" },
    { label: "Data Points/Day", value: "500K+", desc: "Verified API data" },
  ];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-slate-50">
      {/* Continuous Storytelling Background: Grid Pattern & Modern Flow */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-white via-orange-50/30 to-white" />
      
      {/* Ambient Glow Effects - Connecting with Hero Section */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-200/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-100/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main Card Container: Glassmorphism & Tighter Padding */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6 md:p-10 lg:p-12"
        >
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-0">
            
            {stats.map((stat, i) => (
              <div 
                key={i}
                className={`
                  flex-1 flex flex-col items-center justify-center text-center px-4 py-6 md:py-0
                  ${i !== stats.length - 1 ? "border-b md:border-b-0 md:border-r border-slate-100" : ""}
                `}
              >
                {/* Value / Angka Utama - Scale Animation */}
                <motion.h3 
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (i * 0.1), type: "spring", stiffness: 100 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-[950] text-slate-900 tracking-tighter mb-2"
                >
                  {stat.value}
                </motion.h3>
                
                {/* Label & Deskripsi - Gap diperapat */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] md:text-xs font-black text-orange-500 uppercase tracking-[0.2em]">
                    {stat.label}
                  </p>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 italic">
                    {stat.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </motion.div>
      </div>
    </section>
  );
}