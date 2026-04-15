"use client";

import Link from "next/link";
import { useState } from "react";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By accessing or using MetricStock, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform. The materials contained in this platform are protected by applicable copyright and trademark law.`,
  },
  {
    id: "account",
    title: "Account Registration",
    content: `To access certain features of MetricStock, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.`,
  },
  {
    id: "service",
    title: "Use of Service",
    content: `MetricStock grants you a limited, non-exclusive, non-transferable, and revocable license to access and use our platform for your personal or internal business purposes. You may not use the platform for any illegal or unauthorized purpose, nor may you, in the use of the service, violate any laws in your jurisdiction.`,
  },
  {
    id: "payment",
    title: "Payment & Billing",
    content: `Certain features of MetricStock require payment. By selecting a paid plan, you agree to pay all fees associated with your subscription. All payments are processed securely through our payment partners. Fees are non-refundable except as required by law or as explicitly stated in our refund policy. We reserve the right to change our pricing with 30 days' notice.`,
  },
  {
    id: "intellectual",
    title: "Intellectual Property",
    content: `The MetricStock platform and its original content, features, and functionality are owned by MetricStock and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You retain ownership of any data you upload or connect to the platform.`,
  },
  {
    id: "termination",
    title: "Termination",
    content: `We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive.`,
  },
  {
    id: "limitation",
    title: "Limitation of Liability",
    content: `In no event shall MetricStock, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the service.`,
  },
  {
    id: "governing",
    title: "Governing Law",
    content: `These Terms shall be governed and construed in accordance with the laws of Indonesia, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will remain in effect.`,
  },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("acceptance");

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
            Terms of{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Please read these terms carefully before using MetricStock. By using our platform, you agree to these terms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-50/50 p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Have questions about our terms?</h3>
              <p className="text-slate-600 text-sm mb-4">
                Contact us if you need clarification on any of our Terms of Service.
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