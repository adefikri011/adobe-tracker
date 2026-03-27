"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
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
    color: "bg-violet-100 text-violet-600",
  },
  {
    name: "James Kowalski",
    role: "Freelance Photographer · 5 years",
    avatar: "JK",
    rating: 5,
    review:
      "The market trends feature is a game changer. I used to upload blindly — now I know exactly what buyers are searching for before I even shoot. Incredibly powerful tool.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    name: "Priya Nair",
    role: "Digital Illustrator · 2 years",
    avatar: "PN",
    rating: 4,
    review:
      "Clean, fast, and easy to navigate. The export reports saved me hours every month. I finally have a clear picture of my performance without digging through spreadsheets.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    name: "Carlos Mendez",
    role: "Motion Designer · 4 years",
    avatar: "CM",
    rating: 5,
    review:
      "I've tried other analytics tools but nothing comes close. The smart alerts alone are worth it — I got notified when one of my vectors went viral and could respond in real time.",
    color: "bg-sky-100 text-sky-600",
  },
  {
    name: "Yuki Tanaka",
    role: "Stock Videographer · 6 years",
    avatar: "YT",
    rating: 5,
    review:
      "As someone managing over 800 assets, having everything in one dashboard is a lifesaver. The performance charts are beautiful and actually useful — not just pretty graphs.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    name: "Anika Hoffmann",
    role: "Graphic Designer · 1 year",
    avatar: "AH",
    rating: 4,
    review:
      "Even as a newer contributor, TrackStock helped me understand what's working early on. The free plan was enough to get started and the upgrade was a no-brainer after my first month.",
    color: "bg-amber-100 text-amber-600",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "text-orange-400" : "text-gray-200"}`}
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
    <section id="reviews" className="relative py-16 md:py-24 px-6 bg-white overflow-hidden">
      {/* Continuous Storytelling Background */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-orange-50/30 via-white to-white" />
      <div className="absolute top-[-5%] right-[-10%] w-[400px] h-[400px] bg-orange-200/20 rounded-full blur-[120px] -z-10 opacity-60" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-orange-100/15 rounded-full blur-[100px] -z-10 opacity-50" />
      
      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header - Margin Dikurangi */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="text-center mb-12"
        >
          <motion.p
            variants={fadeUp}
            className="text-orange-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3"
          >
            Trusted by contributors
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            What our users say
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-gray-500 text-base md:text-lg font-medium max-w-md mx-auto"
          >
            Thousands of Adobe Stock contributors trust TrackStock to grow their business.
          </motion.p>

          {/* Aggregate rating */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-3 mt-5"
          >
            <StarRating count={5} />
            <span className="text-gray-900 font-bold text-sm">4.9</span>
            <span className="text-gray-400 text-xs">from 2,300+ reviews</span>
          </motion.div>
        </motion.div>

        {/* Cards Grid - Gap Dikurangi */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-4 md:gap-6"
        >
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
              className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 flex flex-col gap-3 cursor-default transition-shadow duration-300"
            >
              {/* Star */}
              <div className="mb-1">
                <StarRating count={r.rating} />
              </div>

              {/* Review text */}
              <p className="text-gray-600 text-sm leading-relaxed font-medium flex-1">
                "{r.review}"
              </p>

              {/* Divider */}
              <div className="h-px bg-gray-100 my-1" />

              {/* Author */}
              <div className="flex items-center gap-3 mt-auto">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black ${r.color}`}
                >
                  {r.avatar}
                </div>
                <div>
                  <div className="text-gray-900 font-bold text-sm">{r.name}</div>
                  <div className="text-gray-400 text-[11px]">{r.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}