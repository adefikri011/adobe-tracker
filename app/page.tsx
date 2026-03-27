import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">T</div>
          <span className="font-semibold text-lg">TrackStock</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition">Login</Link>
          <Link href="/register" className="text-sm bg-orange-500 hover:bg-orange-600 transition px-4 py-2 rounded-lg font-medium">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="inline-block bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs px-3 py-1 rounded-full mb-6">
          Real-time Adobe Stock Analytics
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Track Your Adobe Stock
          <span className="text-orange-500"> Performance</span>
        </h1>
        <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
          See real download data, analyze trending assets, and discover what sells best on Adobe Stock — all in one dashboard.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="bg-orange-500 hover:bg-orange-600 transition px-8 py-3 rounded-xl font-semibold text-base">
            Start for Free
          </Link>
          <Link href="/dashboard" className="border border-white/20 hover:border-white/40 transition px-8 py-3 rounded-xl font-semibold text-base text-white/70 hover:text-white">
            View Demo Dashboard →
          </Link>
        </div>
        <p className="text-white/30 text-sm mt-4">No credit card required · Free plan available</p>
      </section>

      {/* STATS BAR */}
      <div className="border-y border-white/10 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { label: "Assets Tracked", value: "2.4M+" },
            { label: "Contributors", value: "18K+" },
            { label: "Data Points/Day", value: "500K+" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-orange-500">{s.value}</div>
              <div className="text-white/40 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to grow</h2>
        <p className="text-white/40 text-center mb-14">Built specifically for Adobe Stock contributors</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "📊", title: "Download Analytics", desc: "Track which assets get the most downloads and when. Understand your best performing content." },
            { icon: "💰", title: "Revenue Tracking", desc: "Monitor earnings per asset, category, and time period. Know exactly where your income comes from." },
            { icon: "🔍", title: "Market Trends", desc: "Discover trending keywords and categories. Stay ahead of what buyers are looking for." },
            { icon: "📈", title: "Performance Charts", desc: "Interactive charts showing your growth over time. Compare periods and spot opportunities." },
            { icon: "🔔", title: "Smart Alerts", desc: "Get notified when your assets hit milestones or when trends shift in your categories." },
            { icon: "📤", title: "Export Reports", desc: "Download your analytics as CSV or Excel. Share reports with your team easily." },
          ].map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-white/40 text-center mb-14">Start free, upgrade when you're ready</p>
        <div className="grid md:grid-cols-2 gap-6">

          {/* FREE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="text-white/50 text-sm mb-2">Free</div>
            <div className="text-4xl font-bold mb-1">$0</div>
            <div className="text-white/30 text-sm mb-8">Forever free</div>
            <ul className="space-y-3 mb-8">
              {[
                "Up to 5 assets tracked",
                "Basic download stats",
                "Last 7 days data",
                "CSV export (limited)",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
              {["Advanced analytics", "Unlimited assets", "Market trends", "Priority support"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/20 line-through">
                  <span>✗</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block text-center border border-white/20 hover:border-white/40 transition py-3 rounded-xl text-sm font-medium">
              Get Started Free
            </Link>
          </div>

          {/* PRO */}
          <div className="bg-orange-500/10 border border-orange-500/40 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 bg-orange-500 text-xs px-3 py-1 rounded-full font-medium">Most Popular</div>
            <div className="text-orange-400 text-sm mb-2">Pro</div>
            <div className="text-4xl font-bold mb-1">$9<span className="text-lg font-normal text-white/40">/mo</span></div>
            <div className="text-white/30 text-sm mb-8">Billed monthly</div>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited assets tracked",
                "Full download & revenue stats",
                "365 days historical data",
                "Market trends & insights",
                "Unlimited CSV/Excel export",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="text-orange-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=pro" className="block text-center bg-orange-500 hover:bg-orange-600 transition py-3 rounded-xl text-sm font-semibold">
              Start Pro Plan
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-white/20 text-sm">
        © 2025 TrackStock. Built for Adobe Stock Contributors.
      </footer>
    </main>
  );
}