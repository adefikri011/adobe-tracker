"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const reviews = [
  {
    name: "Sarah Mitchell",
    role: "Adobe Stock Contributor · 3 years",
    avatar: "SM",
    rating: 5,
    review:
      "TrackStock completely changed how I manage my portfolio. I can finally see which assets are driving revenue and double down on what works. My earnings grew 40% in just 3 months.",
  },
  {
    name: "James Kowalski",
    role: "Freelance Photographer · 5 years",
    avatar: "JK",
    rating: 5,
    review:
      "The market trends feature is a game changer. I used to upload blindly — now I know exactly what buyers are searching for before I even shoot. Incredibly powerful tool.",
  },
  {
    name: "Priya Nair",
    role: "Digital Illustrator · 2 years",
    avatar: "PN",
    rating: 4,
    review:
      "Clean, fast, and easy to navigate. The export reports saved me hours every month. I finally have a clear picture of my performance without digging through spreadsheets.",
  },
  {
    name: "Carlos Mendez",
    role: "Motion Designer · 4 years",
    avatar: "CM",
    rating: 5,
    review:
      "I've tried other analytics tools but nothing comes close. The smart alerts alone are worth it — I got notified when one of my vectors went viral and could respond in real time.",
  },
  {
    name: "Yuki Tanaka",
    role: "Stock Videographer · 6 years",
    avatar: "YT",
    rating: 5,
    review:
      "As someone managing over 800 assets, having everything in one dashboard is a lifesaver. The performance charts are beautiful and actually useful — not just pretty graphs.",
  },
  {
    name: "Anika Hoffmann",
    role: "Graphic Designer · 1 year",
    avatar: "AH",
    rating: 4,
    review:
      "Even as a newer contributor, TrackStock helped me understand what's working early on. The free plan was enough to get started and the upgrade was a no-brainer after my first month.",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < count ? "text-orange-400" : "text-slate-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function CustomerReview() {
  return (
    <section id="reviews" className="relative py-16 md:py-24 px-4 sm:px-5 md:px-6 bg-slate-50/50 overflow-hidden">
      {/* Background Decoration - Dot Pattern (Berbeda dengan bagian fitur) */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      <div className="absolute top-[-5%] right-[-10%] w-[400px] h-[400px] bg-orange-200/20 rounded-full blur-[120px] -z-10 opacity-60" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-orange-100/15 rounded-full blur-[100px] -z-10 opacity-50" />
      
      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="text-center mb-12 sm:mb-14 md:mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-orange-500 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-3 sm:mb-4"
          >
            Social Proof
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4 sm:mb-6 leading-[1.1]"
          >
            Loved by Creators <br className="md:hidden"/> Worldwide
          </motion.h2>
          <motion.div
            variants={fadeUp}
            className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-white/60 backdrop-blur-sm border border-orange-100 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm"
          >
            <StarRating count={5} />
            <span className="text-slate-900 font-bold text-xs sm:text-sm">4.9/5</span>
            <span className="text-slate-400 text-[10px] sm:text-xs border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-3">
              from 2,300+ verified users
            </span>
          </motion.div>
        </motion.div>

        {/* Cards Grid - "Mosaic Glass" Style */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
        >
          {reviews.map((r, i) => {
            // Variant Backgrounds untuk menghilangkan kesan "kotak sama"
            const cardStyle = i % 3 === 0 
              ? "bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/50" 
              : i % 3 === 1 
              ? "bg-slate-50/90 backdrop-blur-md border border-slate-100/50" 
              : "bg-orange-50/60 backdrop-blur-md border border-orange-100/50";

            return (
              <motion.div
                key={r.name}
                variants={fadeUp}
                custom={i}
                whileHover={{ scale: 1.02 }}
                className={`relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl flex flex-col justify-between h-full transition-all duration-300 ${cardStyle}`}
              >
                {/* Decorative Quote Icon */}
                <Quote className="absolute top-4 sm:top-5 md:top-6 left-4 sm:left-5 md:left-6 w-8 sm:w-9 md:w-10 h-8 sm:h-9 md:h-10 text-orange-200 -z-0 transform -rotate-6" />
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Stars & Header */}
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <StarRating count={r.rating} />
                  </div>

                  {/* Review Text */}
                  <p className="text-slate-700 text-xs sm:text-sm md:text-base leading-relaxed font-medium mb-6 sm:mb-7 md:mb-8 flex-1 italic">
                    "{r.review}"
                  </p>

                  {/* Author Section (Minimalist, no box) */}
                  <div className="mt-auto pt-4 sm:pt-5 md:pt-6 border-t border-slate-200/50 flex items-center gap-3 sm:gap-4">
                    <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0">
                      {r.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-900 font-black text-xs sm:text-sm leading-tight">
                        {r.name}
                      </div>
                      <div className="text-slate-500 text-[9px] sm:text-[10px] md:text-[11px] mt-0.5 font-medium truncate">
                        {r.role}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}