"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const CHART_DATA = [
  { day: "Mon", downloads: 420 },
  { day: "Tue", downloads: 380 },
  { day: "Wed", downloads: 510 },
  { day: "Thu", downloads: 470 },
  { day: "Fri", downloads: 620 },
  { day: "Sat", downloads: 580 },
  { day: "Sun", downloads: 490 },
];

const CATEGORY_DATA = [
  { name: "Nature", value: 4200 },
  { name: "Business", value: 3100 },
  { name: "Abstract", value: 2400 },
  { name: "Technology", value: 1900 },
  { name: "Lifestyle", value: 1600 },
];

const PIE_COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

type Asset = {
  adobeId: string;
  title: string;
  creator: string;
  category: string;
  type: string;
  downloads: number;
  trend: string;
  revenue: string;
  status: string;
};

const PREVIEW: Record<string, string> = {
  Nature: "🌅", Business: "💼", Abstract: "🌊",
  Technology: "💻", Lifestyle: "☕", Art: "🌸",
  Urban: "🌃", Default: "📷",
};

function getTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── PAYMENT MODAL ───────────────────────────────────────────────
type PaymentStep = "select" | "form" | "processing" | "success";
type PaymentMethod = "card" | "bank" | "qris";

function PaymentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<PaymentStep>("select");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [progress, setProgress] = useState(0);

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) =>
    v.replace(/\D/g, "").slice(0, 4).replace(/(.{2})/, "$1/");

  const handlePay = () => {
    setStep("processing");
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setTimeout(() => setStep("success"), 400);
      }
      setProgress(Math.min(p, 100));
    }, 200);
  };

  const handleSuccess = () => { onSuccess(); onClose(); };

  // Generate stable QRIS ID
  const [qrisId] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* SELECT METHOD */}
        {step === "select" && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Upgrade to Pro</h2>
                <p className="text-white/40 text-sm mt-0.5">Unlock unlimited access</p>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white transition text-xl leading-none">✕</button>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">TrackStock Pro</div>
                <div className="text-white/40 text-xs mt-0.5">Monthly subscription · Unlimited results</div>
              </div>
              <div className="text-orange-400 font-bold text-xl">$9<span className="text-sm font-normal text-white/40">/mo</span></div>
            </div>
            <p className="text-white/40 text-xs mb-3 uppercase tracking-wider">Choose payment method</p>
            <div className="space-y-3 mb-6">
              {[
                { id: "card" as PaymentMethod, icon: "💳", label: "Credit / Debit Card", sub: "Visa, Mastercard, JCB" },
                { id: "bank" as PaymentMethod, icon: "🏦", label: "Bank Transfer", sub: "BCA, Mandiri, BNI, BRI" },
                { id: "qris" as PaymentMethod, icon: "📱", label: "QRIS", sub: "GoPay, OVO, Dana, ShopeePay" },
              ].map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition text-left ${
                    method === m.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}>
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-xs text-white/40">{m.sub}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                    method === m.id ? "border-orange-500" : "border-white/20"
                  }`}>
                    {method === m.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("form")}
              className="w-full bg-orange-500 hover:bg-orange-600 transition py-3.5 rounded-xl font-semibold text-sm">
              Continue →
            </button>
            <p className="text-center text-white/20 text-xs mt-3">🔒 Secured with 256-bit SSL encryption</p>
          </div>
        )}

        {/* FORM */}
        {step === "form" && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep("select")} className="text-white/40 hover:text-white transition text-sm">← Back</button>
              <h2 className="text-xl font-bold">
                {method === "card" && "Card Details"}
                {method === "bank" && "Bank Transfer"}
                {method === "qris" && "Scan QRIS"}
              </h2>
            </div>

            {method === "card" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-500/30 to-orange-800/30 border border-orange-500/20 rounded-2xl p-5 mb-2">
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-white/40 text-xs">TrackStock Pro</div>
                    <div className="text-white font-bold text-lg">VISA</div>
                  </div>
                  <div className="font-mono text-lg tracking-widest text-white/80 mb-4">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span>{cardName || "YOUR NAME"}</span>
                    <span>{expiry || "MM/YY"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Card Number</label>
                  <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-orange-500/50 transition" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Cardholder Name</label>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="JOHN DOE"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Expiry Date</label>
                    <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-orange-500/50 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">CVV</label>
                    <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="•••" type="password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-orange-500/50 transition" />
                  </div>
                </div>
              </div>
            )}

            {method === "bank" && (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white/40 text-xs mb-4 uppercase tracking-wider">Transfer to</p>
                  {[
                    { bank: "BCA", account: "1234567890", name: "PT TrackStock Indonesia" },
                    { bank: "Mandiri", account: "0987654321", name: "PT TrackStock Indonesia" },
                  ].map((b) => (
                    <div key={b.bank} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div>
                        <div className="font-semibold text-sm">{b.bank}</div>
                        <div className="text-white/40 text-xs">{b.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-orange-400">{b.account}</div>
                        <button
                          onClick={() => navigator.clipboard.writeText(b.account)}
                          className="text-xs text-white/30 hover:text-white transition">
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-xs text-orange-300">
                  💡 Transfer exactly <span className="font-bold">$9.00 (Rp 147.000)</span> — your account will be activated automatically within 5 minutes.
                </div>
              </div>
            )}

            {method === "qris" && (
              <div className="text-center space-y-4">
                <div className="bg-white rounded-2xl p-6 inline-block mx-auto">
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div key={i} className={`w-5 h-5 rounded-sm ${
                        [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,
                         8,15,22,29,36,10,17,24,31,38,11,18,25,32,39].includes(i)
                          ? "bg-gray-900" : "bg-white"
                      }`} />
                    ))}
                  </div>
                </div>
                <p className="text-white/40 text-sm">Scan with GoPay, OVO, Dana, or ShopeePay</p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/40">
                  QRIS ID: <span className="font-mono text-orange-400">TRK-{qrisId}</span>
                  <span className="ml-2 text-white/20">· Expires in 10:00</span>
                </div>
              </div>
            )}

            <button onClick={handlePay}
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600 transition py-3.5 rounded-xl font-semibold text-sm">
              {method === "card" && "Pay $9.00 →"}
              {method === "bank" && "I Have Transferred →"}
              {method === "qris" && "I Have Paid →"}
            </button>
            <p className="text-center text-white/20 text-xs mt-3">🔒 Demo mode — no real payment processed</p>
          </div>
        )}

        {/* PROCESSING */}
        {step === "processing" && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
            </div>
            <h2 className="text-xl font-bold mb-2">Processing Payment</h2>
            <p className="text-white/40 text-sm mb-8">Please wait, do not close this window...</p>
            <div className="space-y-3 text-left mb-6">
              {[
                { label: "Verifying payment details", done: progress > 25 },
                { label: "Connecting to payment gateway", done: progress > 50 },
                { label: "Activating Pro subscription", done: progress > 75 },
                { label: "Finalizing your account", done: progress >= 100 },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
                    s.done ? "bg-green-500 text-white" : "bg-white/10 text-white/20"
                  }`}>
                    {s.done ? "✓" : "○"}
                  </div>
                  <span className={`text-sm transition-all duration-500 ${s.done ? "text-white" : "text-white/30"}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-white/5 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }} />
            </div>
            <div className="text-orange-400 text-xs mt-2">{Math.round(progress)}%</div>
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-white/40 text-sm mb-6">Welcome to TrackStock Pro 🎉</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left mb-6 space-y-3">
              {[
                { label: "Plan", value: "TrackStock Pro" },
                { label: "Amount", value: "$9.00 / month" },
                { label: "Status", value: "✓ Active", green: true },
                { label: "Invoice", value: `#INV-${Date.now().toString().slice(-6)}` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-white/40">{r.label}</span>
                  <span className={r.green ? "text-green-400 font-semibold" : "text-white font-medium"}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-left mb-6">
              {["Unlimited search results", "Advanced analytics & charts", "Export data CSV/Excel", "Priority support"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-green-400 text-xs">✓</span>{f}
                </div>
              ))}
            </div>
            <button onClick={handleSuccess}
              className="w-full bg-orange-500 hover:bg-orange-600 transition py-3.5 rounded-xl font-semibold text-sm">
              Start Exploring Pro Features →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Asset[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => { setIsPro(d.plan === "pro"); setPlanLoading(false); })
      .catch(() => setPlanLoading(false));
  }, []);

  const handleUpgradeSuccess = async () => {
    await fetch("/api/user/upgrade", { method: "POST" });
    setIsPro(true);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results);
      setFromCache(data.fromCache);
      setCachedAt(data.cachedAt ?? null);
      setSearched(true);
    } catch { console.error("Search failed"); }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // ── Export CSV ──
  const handleExportCSV = () => {
    const exportData = isPro ? results : results.slice(0, 5);
    const headers = ["Title", "Creator", "Category", "Type", "Downloads", "Trend", "Revenue"];
    const rows = exportData.map((a) => [
      `"${a.title}"`, `"${a.creator}"`, `"${a.category}"`,
      a.type, a.downloads, a.trend, `"${a.revenue}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trackstock-${query}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleResults = isPro ? results : results.slice(0, 5);
  const lockedResults = isPro ? [] : results.slice(5);

  const totalDownloads = results.reduce((s, a) => s + a.downloads, 0);
  const avgDownloads = results.length ? Math.round(totalDownloads / results.length) : 0;
  const typeBreakdown = results.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1; return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(typeBreakdown).map(([name, value]) => ({ name, value }));
  const trendingAsset = [...results].sort((a, b) =>
    parseInt(b.trend.replace(/[^0-9]/g, "")) - parseInt(a.trend.replace(/[^0-9]/g, ""))
  )[0];

  return (
    <>
      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} onSuccess={handleUpgradeSuccess} />
      )}

      <main className="min-h-screen bg-[#0a0a0a] text-white">

        {/* NAVBAR */}
        <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">T</div>
            <span className="font-semibold text-lg">TrackStock</span>
          </div>
          <div className="flex items-center gap-3">
            {!isPro && !planLoading && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-lg">
                <span className="text-orange-400 text-xs font-medium">Free Plan</span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/40 text-xs">5 results/search</span>
              </div>
            )}
            {isPro && !planLoading && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
                <span className="text-green-400 text-xs font-medium">⚡ Pro Plan</span>
              </div>
            )}
            {!isPro && (
              <button onClick={() => setShowPayment(true)} disabled={planLoading}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition px-4 py-1.5 rounded-lg text-sm font-medium">
                Upgrade Pro
              </button>
            )}
            {isPro && (
              <button disabled className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-1.5 rounded-lg text-sm font-medium cursor-default">
                ✓ Pro
              </button>
            )}
            <button onClick={handleSignOut} className="text-white/40 hover:text-white transition text-sm">
              Sign Out
            </button>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-10">

          {/* SEARCH */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Adobe Stock Analytics</h1>
            <p className="text-white/40 text-sm mb-8">Search any keyword to discover top-performing assets</p>
            <div className="flex gap-3 max-w-2xl mx-auto">
              <input type="text" value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Try: 'nature', 'business', 'abstract'..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition"
              />
              <button onClick={handleSearch} disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition px-8 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching...</>
                  : "Search"}
              </button>
            </div>
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              {["All Types", "Photo", "Vector", "Video"].map((f) => (
                <button key={f} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:border-orange-500/40 hover:text-orange-400 transition">{f}</button>
              ))}
              <span className="text-white/20 text-xs">|</span>
              {["Relevance", "Most Downloads", "Trending"].map((f) => (
                <button key={f} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:border-orange-500/40 hover:text-orange-400 transition">{f}</button>
              ))}
            </div>
          </div>

          {/* OVERVIEW — sebelum search */}
          {!searched && (
            <>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Assets Indexed", value: "2.4M+", sub: "Updated daily" },
                  { label: "Avg Downloads/Day", value: "48K", sub: "Across all categories" },
                  { label: "Top Category", value: "Nature", sub: "Most downloaded" },
                  { label: "Trending Now", value: "AI Art", sub: "+142% this week" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="text-white/40 text-xs mb-2">{s.label}</div>
                    <div className="text-2xl font-bold text-orange-500">{s.value}</div>
                    <div className="text-white/30 text-xs mt-1">{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-semibold mb-1">Download Trend</h3>
                  <p className="text-white/30 text-xs mb-6">Last 7 days</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="downloads" stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-semibold mb-1">Top Categories</h3>
                  <p className="text-white/30 text-xs mb-6">By total downloads</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={CATEGORY_DATA} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} width={70} />
                      <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* HASIL SEARCH */}
          {searched && (
            <div>
              {/* STAT CARDS */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-white/40 text-xs mb-2">Assets Found</div>
                  <div className="text-2xl font-bold text-orange-500">{results.length}</div>
                  <div className="text-white/30 text-xs mt-1">for "{query}"</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-white/40 text-xs mb-2">Total Downloads</div>
                  <div className="text-2xl font-bold text-orange-500">{totalDownloads.toLocaleString()}</div>
                  <div className="text-white/30 text-xs mt-1">across all results</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-white/40 text-xs mb-2">Avg Downloads</div>
                  <div className="text-2xl font-bold text-orange-500">{avgDownloads.toLocaleString()}</div>
                  <div className="text-white/30 text-xs mt-1">per asset</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-white/40 text-xs mb-2">Fastest Growing</div>
                  <div className="text-lg font-bold text-green-400">{trendingAsset?.trend ?? "—"}</div>
                  <div className="text-white/30 text-xs mt-1 truncate">{trendingAsset?.title ?? "—"}</div>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-semibold mb-1">Downloads by Asset</h3>
                  <p className="text-white/30 text-xs mb-4">Top results for "{query}"</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={results.slice(0, 8).map((a) => ({
                      name: a.title.split(" ").slice(0, 2).join(" "),
                      downloads: a.downloads,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Bar dataKey="downloads" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-semibold mb-1">Type Breakdown</h3>
                  <p className="text-white/30 text-xs mb-4">Photo / Vector / Video</p>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={130}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-2">
                        {pieData.map((d, i) => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-white/60">{d.name}</span>
                            </div>
                            <span className="text-white/40">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <div className="text-white/20 text-xs text-center pt-8">No data</div>}
                </div>
              </div>

              {/* RESULT HEADER + EXPORT */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-semibold">
                      Results for <span className="text-orange-500">"{query}"</span>
                    </h2>
                    {fromCache ? (
                      <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-1 rounded-lg">
                        ⚡ Cached {cachedAt ? getTimeAgo(cachedAt) : ""}
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-1 rounded-lg">
                        🔄 Live Data — saved to cache
                      </span>
                    )}
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">
                    {results.length} assets found · Sorted by downloads
                  </p>
                </div>

                {/* RIGHT SIDE: export + upgrade hint */}
                <div className="flex items-center gap-3">
                  <button onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition px-4 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white">
                    ⬇ Export CSV
                    {!isPro && <span className="text-white/25">(5 rows)</span>}
                  </button>
                  {!isPro && (
                    <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-lg text-xs text-orange-400">
                      Showing 5 of {results.length} ·{" "}
                      <span onClick={() => setShowPayment(true)} className="underline cursor-pointer">
                        Upgrade for full access
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* TABLE HEADER */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-white/30 uppercase tracking-wider mb-2">
                <div className="col-span-5">Asset</div>
                <div className="col-span-2 text-center">Type</div>
                <div className="col-span-2 text-center">Downloads</div>
                <div className="col-span-1 text-center">Trend</div>
                <div className="col-span-2 text-right">Revenue Est.</div>
              </div>

              {/* VISIBLE ROWS */}
              <div className="space-y-2">
                {visibleResults.map((item) => (
                  <div key={item.adobeId} className="grid grid-cols-12 gap-4 items-center bg-white/5 hover:bg-white/8 border border-white/10 hover:border-orange-500/20 transition rounded-xl px-4 py-4">
                    <div className="col-span-5 flex items-center gap-3">
                      <span className="text-2xl">{PREVIEW[item.category] ?? PREVIEW.Default}</span>
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-white/30">{item.category} · by {item.creator}</div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white/60">{item.type}</span>
                    </div>
                    <div className="col-span-2 text-center font-semibold text-sm">{item.downloads.toLocaleString()}</div>
                    <div className="col-span-1 text-center text-xs text-green-400 font-medium">{item.trend}</div>
                    <div className="col-span-2 text-right text-sm text-orange-400 font-semibold">{item.revenue}</div>
                  </div>
                ))}
              </div>

              {/* LOCKED ROWS */}
              {!isPro && lockedResults.length > 0 && (
                <div className="relative mt-2">
                  <div className="space-y-2 opacity-30 blur-sm pointer-events-none select-none">
                    {lockedResults.map((item) => (
                      <div key={item.adobeId} className="grid grid-cols-12 gap-4 items-center bg-white/5 border border-white/10 rounded-xl px-4 py-4">
                        <div className="col-span-5 flex items-center gap-3">
                          <span className="text-2xl">{PREVIEW[item.category] ?? PREVIEW.Default}</span>
                          <div>
                            <div className="text-sm font-medium">{item.title}</div>
                            <div className="text-xs text-white/30">{item.category}</div>
                          </div>
                        </div>
                        <div className="col-span-2 text-center"><span className="text-xs bg-white/10 px-2 py-1 rounded-md">{item.type}</span></div>
                        <div className="col-span-2 text-center font-semibold text-sm">{item.downloads.toLocaleString()}</div>
                        <div className="col-span-1 text-center text-xs text-green-400">{item.trend}</div>
                        <div className="col-span-2 text-right text-sm text-orange-400 font-semibold">{item.revenue}</div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#0a0a0a]/90 border border-orange-500/30 rounded-2xl p-8 text-center">
                      <div className="text-3xl mb-3">🔒</div>
                      <h3 className="font-bold mb-1">Unlock Full Results</h3>
                      <p className="text-white/40 text-sm mb-4">{lockedResults.length} more assets hidden</p>
                      <button onClick={() => setShowPayment(true)}
                        className="bg-orange-500 hover:bg-orange-600 transition px-6 py-2.5 rounded-xl text-sm font-semibold">
                        Upgrade to Pro — $9/mo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}