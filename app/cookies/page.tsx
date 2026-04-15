"use client";

import Link from "next/link";
import { useState } from "react";

const cookieTypes = [
  {
    id: "essential",
    title: "Essential Cookies",
    badge: "Always Active",
    badgeColor: "text-green-600 bg-green-50 border-green-200",
    content: `These cookies are necessary for MetricStock to function properly and cannot be switched off. They are usually set in response to actions made by you, such as setting your privacy preferences, logging in, or filling out forms. You can set your browser to block these cookies, but some parts of the platform may not work as expected.`,
    examples: ["Session authentication", "Security tokens", "User preferences storage"],
  },
  {
    id: "analytics",
    title: "Analytics Cookies",
    badge: "Optional",
    badgeColor: "text-orange-600 bg-orange-50 border-orange-200",
    content: `These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our platform. They help us understand which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.`,
    examples: ["Page view tracking", "Session duration", "User flow analysis"],
  },
  {
    id: "functional",
    title: "Functional Cookies",
    badge: "Optional",
    badgeColor: "text-orange-600 bg-orange-50 border-orange-200",
    content: `These cookies enable MetricStock to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we use on our platform. If you disable these cookies, some or all of these features may not function properly.`,
    examples: ["Language preferences", "Dashboard layout settings", "Chart display preferences"],
  },
  {
    id: "marketing",
    title: "Marketing Cookies",
    badge: "Optional",
    badgeColor: "text-orange-600 bg-orange-50 border-orange-200",
    content: `These cookies may be set through our platform by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertising on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device.`,
    examples: ["Ad campaign tracking", "Retargeting", "Conversion tracking"],
  },
];

const sections = [
  {
    id: "what",
    title: "What Are Cookies?",
    content: `Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site. MetricStock uses cookies to enhance your experience and to help us understand how our platform is being used.`,
  },
  {
    id: "control",
    title: "How to Control Cookies",
    content: `You can control and manage cookies in various ways. Most browsers allow you to refuse cookies or to alert you when cookies are being sent. However, please note that if you disable cookies, some features of MetricStock may not function correctly. You can also clear cookies from your browser at any time through your browser settings.`,
  },
  {
    id: "thirdparty",
    title: "Third-Party Cookies",
    content: `In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service and to deliver advertisements. These third parties include analytics providers and advertising networks. We do not control these third-party cookies and they are subject to the third party's own privacy policies.`,
  },
];

export default function CookiesPage() {
  const [activeSection, setActiveSection] = useState("essential");

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
            Cookies{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Learn how MetricStock uses cookies to improve your experience and what choices you have.
          </p>
        </div>

        {/* Cookie types grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-slate-700">Types of Cookies We Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cookieTypes.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:border-orange-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900">{c.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${c.badgeColor}`}>
                    {c.badge}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{c.content}</p>
                <div className="space-y-1.5">
                  {c.examples.map((ex) => (
                    <div key={ex} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1 h-1 rounded-full bg-orange-400" />
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional sections */}
        <div className="space-y-6 mb-8">
          {sections.map((s, i) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
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
          <h3 className="text-lg font-bold text-slate-900 mb-2">Questions about cookies?</h3>
          <p className="text-slate-600 text-sm mb-4">Reach out to our team for any questions about how we use cookies.</p>
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