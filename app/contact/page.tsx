"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        console.error("Error:", data.error);
        return;
      }

      setStatus("sent");
    } catch (error) {
      setStatus("error");
      console.error("Failed to send message:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setIsSubjectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const contactInfo = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: "Email",
      value: "admin@metricstock.com",
      href: "mailto:admin@metricstock.com",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Response Time",
      value: "Within 24 hours",
      href: null,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
      ),
      label: "Platform",
      value: "metricstock.com",
      href: "https://metricstock.com",
    },
  ];

  const subjects = [
    "General Inquiry",
    "Technical Support",
    "Billing & Payments",
    "Feature Request",
    "Partnership",
    "Other",
  ];

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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
            Contact{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Us
            </span>
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-base leading-relaxed">
            Have a question or need help? Our team is here for you. We typically respond within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="space-y-4">
            {contactInfo.map((info, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 flex-shrink-0">
                    {info.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{info.label}</span>
                </div>
                {info.href ? (
                  <a href={info.href} className="text-slate-900 font-medium hover:text-orange-600 transition-colors text-sm">
                    {info.value}
                  </a>
                ) : (
                  <span className="text-slate-900 font-medium text-sm">{info.value}</span>
                )}
              </div>
            ))}

            {/* FAQ note */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h4 className="font-bold text-slate-900 mb-2 text-sm">Before you reach out</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                For billing issues, please have your account email ready. For technical issues, describe the problem in detail including any error messages you see.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              {status === "error" ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">Oops! Something went wrong</h3>
                  <p className="text-slate-600 text-sm mb-6">We couldn't send your message. Please try again or contact us directly at admin@metricstock.com</p>
                  <button
                    onClick={() => { setStatus("idle"); }}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm hover:text-slate-900 hover:border-slate-400 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : status === "sent" ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">Message Sent!</h3>
                  <p className="text-slate-600 text-sm mb-6">We'll get back to you at your email within 24 hours.</p>
                  <button
                    onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm hover:text-slate-900 hover:border-slate-400 transition-colors"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                        Your Name
                        {form.name && <span className="text-green-600 text-xs font-normal">✓</span>}
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white transition-colors ${
                          form.name
                            ? "border-green-300 focus:border-green-400"
                            : "border-slate-300 focus:border-orange-400"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                        Email Address
                        {form.email && <span className="text-green-600 text-xs font-normal">✓</span>}
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white transition-colors ${
                          form.email
                            ? "border-green-300 focus:border-green-400"
                            : "border-slate-300 focus:border-orange-400"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                      Subject
                      {form.subject && <span className="text-green-600 text-xs font-normal">✓</span>}
                    </label>
                    <div className="relative" ref={subjectDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:bg-white transition-colors flex items-center justify-between hover:border-slate-400 ${
                          form.subject
                            ? "border-green-300 focus:border-green-400"
                            : "border-slate-300 focus:border-orange-400"
                        }`}
                      >
                        <span className={form.subject ? "text-slate-900" : "text-slate-400"}>
                          {form.subject || "Select a subject..."}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                            isSubjectOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isSubjectOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          {subjects.map((s, idx) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setForm({ ...form, subject: s });
                                setIsSubjectOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                form.subject === s
                                  ? "bg-orange-100 text-orange-700 font-medium"
                                  : "text-slate-900 hover:bg-slate-50"
                              } ${idx !== subjects.length - 1 ? "border-b border-slate-100" : ""}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your question or issue in detail..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs font-medium ${
                        form.message.length < 10
                          ? "text-red-600"
                          : form.message.length >= 5000
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}>
                        {form.message.length < 10
                          ? `Minimum 10 characters required (${form.message.length}/10)`
                          : `${form.message.length}/5000 characters`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending" || form.message.length < 10 || !form.name || !form.email || !form.subject}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 flex items-center justify-center gap-2"
                  >
                    {status === "sending" ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </>
                    ) : form.message.length < 10
                    ? (
                      "Message too short (min 10 chars)"
                    ) : (
                      "Send Message →"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}