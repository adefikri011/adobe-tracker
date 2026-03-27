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
  { icon: BarChart3, title: "Download Analytics", desc: "Track which assets get the most downloads and when. Understand your best performing content." },
  { icon: Wallet, title: "Revenue Tracking", desc: "Monitor earnings per asset, category, and time period. Know exactly where your income comes from." },
  { icon: TrendingUp, title: "Market Trends", desc: "Discover trending keywords and categories. Stay ahead of what buyers are looking for." },
  { icon: LineChart, title: "Performance Charts", desc: "Interactive charts showing your growth over time. Compare periods and spot opportunities." },
  { icon: Bell, title: "Smart Alerts", desc: "Get notified when your assets hit milestones or when trends shift in your categories." },
  { icon: Download, title: "Export Reports", desc: "Download your analytics as CSV or Excel. Share reports with your team easily." },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-16 md:py-24 overflow-hidden bg-white">
      
      {/* Continuous Storytelling Background */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-white via-orange-50/10 to-white" />
      {/* Grid Pattern untuk tekstur modern */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#f9731610_1px,transparent_1px),linear-gradient(to_bottom,#f9731610_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      
      <div className="absolute top-[10%] left-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-orange-200/20 rounded-full blur-[120px] -z-10 opacity-60" />
      <div className="absolute bottom-[10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-orange-100/20 rounded-full blur-[120px] -z-10 opacity-60" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section - Margin Dikurangi */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.span variants={fadeUp} className="px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-6 inline-block border border-orange-100">
            What you get
          </motion.span>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-[950] tracking-tighter text-slate-900 mb-6 leading-[0.95]">
            Everything to grow your <span className="text-orange-500">portfolio</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500 text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Built specifically for Adobe Stock contributors who want real, actionable insights.
          </motion.p>
        </motion.div>

        {/* Features Grid - Gap & Padding Dikurangi agar lebih rapi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
                relative bg-white border border-slate-100 rounded-3xl p-6 md:p-8 
                transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-200 
                group overflow-hidden flex flex-col items-center text-center md:items-start md:text-left
              "
            >
              {/* Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-50/50 rounded-full blur-2xl group-hover:bg-orange-100/60 transition-colors" />

              {/* Icon Container */}
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <f.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>

              {/* Text Content */}
              <h3 className="font-[900] text-slate-900 mb-3 text-lg md:text-xl tracking-tight">
                {f.title}
              </h3>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}