"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  LineChart,
  Bell,
  Download,
  Wallet
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const features = [
  {
    icon: "/icons/barchart.svg",
    title: "Download Analytics",
    desc: "Track which assets get the most downloads and when. Understand your best performing content.",
    bgClass: "bg-gradient-to-br from-orange-500 to-orange-600",
    iconClass: "text-white"
  },
  {
    icon: "/icons/wallet.svg",
    title: "Revenue Tracking",
    desc: "Monitor earnings per asset, category, and time period. Know exactly where your income comes from.",
    bgClass: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconClass: "text-white"
  },
  {
    icon: "/icons/trending.svg",
    title: "Market Trends",
    desc: "Discover trending keywords and categories. Stay ahead of what buyers are looking for.",
    bgClass: "bg-slate-900",
    iconClass: "text-white"
  },
  {
    icon: "/icons/performance.svg",
    title: "Performance Charts",
    desc: "Interactive charts showing your growth over time. Compare periods and spot opportunities.",
    bgClass: "bg-gradient-to-br from-orange-600 to-red-500",
    iconClass: "text-white"
  },
  {
    icon: "/icons/alert.svg",
    title: "Smart Alerts",
    desc: "Get notified when your assets hit milestones or when trends shift in your categories.",
    bgClass: "bg-slate-800",
    iconClass: "text-white"
  },
  {
    icon: "/icons/download.svg",
    title: "Export Reports",
    desc: "Download your analytics as CSV or Excel. Share reports with your team easily.",
    bgClass: "bg-gradient-to-br from-orange-500 to-orange-600",
    iconClass: "text-white"
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative pt-16 md:pt-20 pb-10 md:pb-12 overflow-hidden bg-white">

      {/* Continuous Storytelling Background */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-white via-orange-50/10 to-white" />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#f9731610_1px,transparent_1px),linear-gradient(to_bottom,#f9731610_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

      <div className="absolute top-[10%] left-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-orange-200/20 rounded-full blur-[120px] -z-10 opacity-60" />
      <div className="absolute bottom-[10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-slate-200/40 rounded-full blur-[120px] -z-10 opacity-60" />

      <div className="max-w-6xl mx-auto px-4 sm:px-5 md:px-6">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12 sm:mb-14 md:mb-16">
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-6xl font-[950] tracking-tighter text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-[1.05] sm:leading-[0.95]">
            Everything to grow your <span className="text-orange-500">portfolio</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500 text-sm sm:text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Built specifically for Adobe Stock contributors who want real, actionable insights.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -5 }}
              className="
                relative bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 
                transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 
                group overflow-hidden flex flex-col items-center text-center md:items-start md:text-left
              "
            >
              <div className={`w-12 sm:w-14 h-12 sm:h-14 ${f.bgClass} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 md:mb-6 shadow-lg shadow-black/5 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                <img
                  src={f.icon as string}
                  alt={f.title}
                  className="w-6 sm:w-7 h-6 sm:h-7 object-contain brightness-0 invert"
                />
              </div>

              <h3 className="font-[900] text-slate-900 mb-2 sm:mb-3 text-base sm:text-lg md:text-xl tracking-tight">
                {f.title}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm md:text-base leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}