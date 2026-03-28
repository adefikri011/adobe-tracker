"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Activity, ArrowUpRight, Zap } from "lucide-react";

export default function StatsSection() {
  const stats = [
    { 
      label: "Assets Tracked", 
      value: "2.4M+", 
      desc: "Real-time updates",
      icon: TrendingUp,
      trend: "+12%" 
    },
    { 
      label: "Contributors", 
      value: "18K+", 
      desc: "Global community",
      icon: Users,
      trend: "+5%" 
    },
    { 
      label: "Data Points/Day", 
      value: "500K+", 
      desc: "Verified API data",
      icon: Activity,
      trend: "+24%" 
    },
  ];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-slate-50">
      {/* Continuous Storytelling Background */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-white via-orange-50/30 to-white" />
      
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-200/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-100/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Main Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6 md:p-10 lg:p-12 overflow-hidden group"
        >
          
          {/* DECORATION: Abstract Graph Line Background */}
          <div className="absolute bottom-0 left-0 w-full h-32 opacity-[0.03] pointer-events-none">
             <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-full">
               <path 
                 d="M0,100 C200,80 300,20 500,60 C700,100 800,40 1000,70 C1100,85 1150,90 1200,80 L1200,100 L0,100 Z" 
                 fill="none" 
                 stroke="currentColor" 
                 strokeWidth="2"
                 className="text-orange-900"
               />
               <path 
                 d="M0,100 C150,90 250,50 450,80 C650,110 750,60 950,90 C1050,95 1150,85 1200,90" 
                 fill="none" 
                 stroke="currentColor" 
                 strokeWidth="1"
                 className="text-slate-900"
                 strokeDasharray="4 4"
               />
             </svg>
          </div>

          {/* Top Border Gradient Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50" />

          <div className="relative z-10 flex flex-col md:flex-row items-stretch justify-between gap-0">
            
            {stats.map((stat, i) => (
              <div 
                key={i}
                className={`
                  relative flex-1 flex flex-col items-center justify-center text-center px-4 py-6 md:py-0
                  ${i !== stats.length - 1 ? "border-b md:border-b-0 md:border-r border-slate-100/80" : ""}
                `}
              >
                {/* DECORATION: Background Icon (Faded) */}
                <stat.icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-orange-50 -z-0 opacity-50" />

                {/* Value / Angka Utama */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (i * 0.1), type: "spring", stiffness: 100 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-[950] text-slate-900 tracking-tighter mb-2 flex items-start">
                    {stat.value}
                  </h3>
                  
                  {/* Live Indicator only for first item */}
                  {stat.desc.includes("Real-time") && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 mb-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Live</span>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] md:text-xs font-black text-orange-500 uppercase tracking-[0.2em]">
                        {stat.label}
                      </p>
                      {/* Trend Arrow */}
                      <span className="flex items-center text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 italic flex items-center gap-1">
                      <Zap className="w-3 h-3 text-orange-400 opacity-50" />
                      {stat.desc}
                    </p>
                  </div>
                </motion.div>

              </div>
            ))}

          </div>
        </motion.div>
      </div>
    </section>
  );
}