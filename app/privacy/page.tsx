"use client";

import Link from "next/link";
import { useState } from "react";

const sections = [
  {
    id: "information",
    title: "Information We Collect",
    content: `We collect information you provide directly to us when you create an account, such as your name, email address, and payment information. We also automatically collect certain information about your device and how you interact with MetricStock, including usage data, log data, and analytics information related to your Adobe Stock portfolio performance.`,
  },
  {
    id: "usage",
    title: "How We Use Your Information",
    content: `MetricStock uses the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, respond to your comments and questions, and send you marketing communications (where permitted by law). We also use your data to monitor and analyze trends and usage, detect fraudulent transactions, and comply with legal obligations.`,
  },
  {
    id: "sharing",
    title: "Information Sharing",
    content: `We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except as described in this policy. We may share your information with trusted third-party service providers who assist us in operating our platform, conducting our business, or servicing you — so long as those parties agree to keep this information confidential.`,
  },
  {
    id: "security",
    title: "Data Security",
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing and against accidental loss, destruction, or damage. However, no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    id: "cookies",
    title: "Cookies & Tracking",
    content: `We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.`,
  },
  {
    id: "rights",
    title: "Your Rights",
    content: `You have the right to access, update, or delete the information we have on you. You may also have the right to data portability and to restrict or object to processing of your personal data. To exercise these rights, please contact us at admin@metricstock.com. We will respond to your request within 30 days.`,
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.`,
  },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("information");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Glow blobs */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-orange-400/3 blur-[120px]" />

      {/* Header */}
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
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
            Privacy{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            At MetricStock, your privacy is our priority. This document explains how we collect, use, and protect your data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar nav */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Contents</p>
              <ul className="space-y-1">
                {sections.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => {
                        setActiveSection(s.id);
                        document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                        activeSection === s.id
                          ? "bg-orange-100 text-orange-600 font-medium"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {sections.map((s, i) => (
              <div
                key={s.id}
                id={s.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-8 scroll-mt-24"
                onMouseEnter={() => setActiveSection(s.id)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm">
                    {i + 1}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 pt-1">{s.title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm pl-12">{s.content}</p>
              </div>
            ))}

            {/* Contact box */}
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-50/50 p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Questions about your privacy?</h3>
              <p className="text-slate-600 text-sm mb-4">
                If you have any questions about this Privacy Policy, please contact us.
              </p>
              <a
                href="mailto:admin@metricstock.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                admin@metricstock.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}