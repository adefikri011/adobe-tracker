"use client";

import Link from "next/link";

const licenseItems = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Personal Use",
    description: "You may use MetricStock for personal and internal business purposes related to managing your Adobe Stock portfolio.",
    allowed: true,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Data Export",
    description: "You may export your own data and analytics reports generated from your Adobe Stock account for personal recordkeeping.",
    allowed: true,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Multiple Devices",
    description: "You may access your MetricStock account from multiple devices under the same account credentials.",
    allowed: true,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Reselling",
    description: "You may not resell, sublicense, or redistribute MetricStock or any of its features as your own product or service.",
    allowed: false,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Reverse Engineering",
    description: "You may not reverse engineer, decompile, or attempt to extract the source code of MetricStock's platform.",
    allowed: false,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Unauthorized Automation",
    description: "You may not use automated bots or scripts to scrape, extract, or abuse the MetricStock platform beyond normal usage.",
    allowed: false,
  },
];

const sections = [
  {
    title: "Subscription License",
    content: `MetricStock operates on a subscription-based model. Your license to use the platform is valid only during your active subscription period. Upon cancellation or expiration of your subscription, your access to premium features will be revoked. Your data will be retained for 30 days after cancellation before permanent deletion.`,
  },
  {
    title: "Intellectual Property",
    content: `All content, features, and functionality of MetricStock — including but not limited to software, design, text, graphics, logos, and icons — are the exclusive property of MetricStock and are protected by copyright, trademark, and other intellectual property laws. You retain full ownership of your own Adobe Stock data connected to the platform.`,
  },
  {
    title: "License Violations",
    content: `Any violation of this license agreement may result in immediate termination of your account and access to MetricStock without refund. MetricStock reserves the right to pursue legal action for any unauthorized use, reproduction, or distribution of the platform or its content.`,
  },
];

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-orange-400/3 blur-[120px]" />

      <div className="relative border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Landing Page
          </Link>
          <span className="text-xs text-slate-400">Last updated: April 15, 2025</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
            License{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Agreement
            </span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Understand what you can and cannot do with MetricStock as part of your subscription.
          </p>
        </div>

        {/* Allowed / Not Allowed grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-slate-700">License Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {licenseItems.map((item, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-6 transition-colors ${
                  item.allowed
                    ? "border-green-200 bg-green-50 hover:border-green-300"
                    : "border-red-200 bg-red-50 hover:border-red-300"
                }`}
              >
                <div className={`mb-3 ${item.allowed ? "text-green-600" : "text-red-600"}`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 mb-8">
          {sections.map((s, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <div className="flex items-start gap-4 mb-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm">
                  {i + 1}
                </span>
                <h2 className="text-lg font-bold text-slate-900 pt-1">{s.title}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm pl-12">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-50/50 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-2">License inquiries?</h3>
          <p className="text-slate-600 text-sm mb-4">For any questions regarding our license agreement, please reach out.</p>
          <a
            href="mailto:admin@metricstock.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            admin@metricstock.com
          </a>
        </div>
      </div>
    </div>
  );
}