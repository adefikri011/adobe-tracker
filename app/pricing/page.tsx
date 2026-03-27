"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FREE_FEATURES = [
  { text: "5 results per search", included: true },
  { text: "Basic analytics dashboard", included: true },
  { text: "Search result caching", included: true },
  { text: "Download trend charts", included: true },
  { text: "Full search results", included: false },
  { text: "Advanced filters", included: false },
  { text: "Export data (CSV/Excel)", included: false },
  { text: "Type breakdown analytics", included: false },
  { text: "Priority support", included: false },
];

const PRO_FEATURES = [
  { text: "Unlimited search results", included: true },
  { text: "Full analytics dashboard", included: true },
  { text: "Search result caching", included: true },
  { text: "Download trend charts", included: true },
  { text: "Advanced filters (Type, Sort)", included: true },
  { text: "Export data (CSV/Excel)", included: true },
  { text: "Type breakdown analytics", included: true },
  { text: "Revenue estimation", included: true },
  { text: "Priority support", included: true },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch("/api/user/upgrade", { method: "POST" });
    const data = await res.json();
    if (data.success) router.push("/dashboard");
    else router.push("/login");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">T</div>
          <span className="font-semibold text-lg">TrackStock</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/40 hover:text-white transition text-sm">Sign In</Link>
          <Link href="/register" className="bg-orange-500 hover:bg-orange-600 transition px-4 py-1.5 rounded-lg text-sm font-medium">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full text-orange-400 text-xs font-medium mb-6">
            ⚡ Simple, transparent pricing
          </div>
          <h1 className="text-5xl font-bold mb-4">Choose your plan</h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Start free and upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {/* Free */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col">
            <div>
              <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Free</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-bold">$0</span>
              </div>
              <div className="text-white/30 text-sm mb-8">Forever free · No credit card needed</div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    <span className={f.included ? "text-green-400" : "text-white/20"}>
                      {f.included ? "✓" : "✗"}
                    </span>
                    <span className={f.included ? "text-white/70" : "text-white/25 line-through"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/register"
              className="block w-full text-center border border-white/20 hover:border-white/40 hover:bg-white/5 transition py-3 rounded-xl text-sm font-semibold mt-auto">
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-b from-orange-500/15 to-orange-900/5 border border-orange-500/40 rounded-2xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-orange-500 text-xs font-bold px-3 py-1.5 rounded-bl-xl">
              MOST POPULAR
            </div>
            <div>
              <div className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-3">Pro</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-bold">$9</span>
                <span className="text-white/40 text-sm mb-2">/month</span>
              </div>
              <div className="text-white/30 text-sm mb-8">Billed monthly · Cancel anytime</div>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    <span className="text-green-400">✓</span>
                    <span className="text-white/70">{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={handleUpgrade} disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition py-3.5 rounded-xl text-sm font-semibold mt-auto">
              {loading ? "Processing..." : "Upgrade to Pro →"}
            </button>
            <p className="text-center text-white/20 text-xs mt-3">Demo mode · No real payment</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is the free plan really free?", a: "Yes, forever. No credit card required. You get 5 results per search and basic analytics." },
              { q: "Can I cancel anytime?", a: "Absolutely. Cancel your Pro subscription at any time with no questions asked." },
              { q: "How does the caching system work?", a: "Every search is saved to our PostgreSQL database. If someone searches the same keyword again, we return the cached result instantly — saving API quota and loading 10x faster." },
              { q: "Will I get real Adobe Stock data?", a: "In the full version, yes. The system integrates with Adobe Stock API with an intelligent cache layer to maximize the free API quota." },
            ].map((item) => (
              <div key={item.q} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="font-semibold text-sm mb-2">{item.q}</div>
                <div className="text-white/40 text-sm leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/dashboard" className="text-white/30 hover:text-white/60 transition text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}