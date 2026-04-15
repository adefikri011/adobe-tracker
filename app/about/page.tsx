"use client";

import Link from "next/link";

const stats = [
  { value: "2.4M+", label: "Assets Tracked" },
  { value: "18K+", label: "Contributors" },
  { value: "500K+", label: "Data Points/Day" },
  { value: "99.9%", label: "Uptime" },
];

const values = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Data-Driven",
    description: "Every decision should be backed by real data. We give Adobe Stock contributors the analytics they need to grow.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Real-Time",
    description: "Your portfolio never sleeps, and neither does MetricStock. Get live insights the moment they matter.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure & Private",
    description: "Your data is yours. We use industry-standard encryption and never sell your information to third parties.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Built for Contributors",
    description: "We are creators ourselves. MetricStock is built by people who understand the Adobe Stock ecosystem inside and out.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-[160px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-orange-400/3 blur-[120px]" />

      <div className="relative border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to landing Page
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">

        {/* Hero */}
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight leading-tight">
            Built for Adobe Stock{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Contributors
            </span>
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            MetricStock was born from a simple frustration — Adobe Stock contributors had no proper way to track, analyze, and grow their portfolio performance. We built the tool we always wished existed.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="text-3xl font-black bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent mb-1">
                {s.value}
              </div>
              <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="mb-20">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4 block">Our Mission</span>
              <h2 className="text-3xl font-black mb-6 leading-tight text-slate-900">
                Empowering creators with the data they deserve
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We believe every Adobe Stock contributor — from hobbyist to full-time professional — deserves access to enterprise-level analytics. MetricStock democratizes data so you can focus on what you do best: creating.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our platform tracks over 2.4 million assets daily, processes 500,000+ data points, and delivers insights that help contributors maximize their royalties and understand market trends in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-2xl font-black mb-8 text-center text-slate-900">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map((v, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-8 hover:border-orange-200 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-5 group-hover:scale-105 transition-transform">
                  {v.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-50/50 p-10 text-center">
          <h3 className="text-2xl font-black mb-3 text-slate-900">Ready to grow your Adobe Stock income?</h3>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            Join thousands of contributors already using MetricStock to make smarter decisions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Start for Free →
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold text-sm hover:text-slate-900 hover:border-slate-400 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}