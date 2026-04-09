"use client";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function GatewayPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSaved] = useState(false);

  const [midtrans, setMidtrans] = useState({
    enabled: false,
    serverKey: "",
    clientKey: "",
    mode: "sandbox",
  });
  const [stripe, setStripe] = useState({
    enabled: false,
    serverKey: "",
    publishableKey: "",
    mode: "test",
  });
  const [showMidKey, setShowMidKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);

  // Fetch gateway configs on mount
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/billing/gateway");
        if (!response.ok) throw new Error("Failed to fetch configuration");
        
        const data = await response.json();
        const configs = data.configs;

        // Set Midtrans config
        const midtransConfig = configs.find((c: any) => c.gateway === "midtrans");
        if (midtransConfig) {
          setMidtrans({
            enabled: midtransConfig.enabled,
            serverKey: midtransConfig.serverKey || "",
            clientKey: midtransConfig.clientKey || "",
            mode: midtransConfig.mode || "sandbox",
          });
        }

        // Set Stripe config
        const stripeConfig = configs.find((c: any) => c.gateway === "stripe");
        if (stripeConfig) {
          setStripe({
            enabled: stripeConfig.enabled,
            serverKey: stripeConfig.serverKey || "",
            publishableKey: stripeConfig.publishableKey || "",
            mode: stripeConfig.mode || "test",
          });
        }

        setError("");
      } catch (err: any) {
        console.error("Error fetching configs:", err);
        setError(err.message || "Failed to fetch configuration");
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      // Save Midtrans config
      const midtransRes = await fetch("/api/admin/billing/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "midtrans",
          enabled: midtrans.enabled,
          serverKey: midtrans.serverKey,
          clientKey: midtrans.clientKey,
          mode: midtrans.mode,
        }),
      });

      if (!midtransRes.ok) throw new Error("Failed to save Midtrans configuration");

      // Save Stripe config
      const stripeRes = await fetch("/api/admin/billing/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "stripe",
          enabled: stripe.enabled,
          serverKey: stripe.serverKey,
          publishableKey: stripe.publishableKey,
          mode: stripe.mode,
        }),
      });

      if (!stripeRes.ok) throw new Error("Failed to save Stripe configuration");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Error saving configs:", err);
      setError(err.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gateway Configuration</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">Configure payment gateway credentials</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">Configuration saved successfully!</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin mb-2">
              <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full"></div>
            </div>
            <p className="text-slate-400">Memuat konfigurasi...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Midtrans */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">M</div>
                <div>
                  <h3 className="font-bold text-slate-900">Midtrans</h3>
                  <p className="text-xs text-slate-400">Indonesian payment gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {midtrans.enabled
                  ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={11} /> Connected</span>
                  : <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full"><XCircle size={11} /> Disabled</span>
                }
                <button
                  onClick={() => setMidtrans({ ...midtrans, enabled: !midtrans.enabled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${midtrans.enabled ? "bg-orange-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${midtrans.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Server Key</label>
                <div className="relative">
                  <input
                    type={showMidKey ? "text" : "password"}
                    value={midtrans.serverKey}
                    onChange={e => setMidtrans({ ...midtrans, serverKey: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-orange-400"
                    placeholder="SB-Mid-server-xxxxxxxxxxxx"
                  />
                  <button onClick={() => setShowMidKey(!showMidKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showMidKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Client Key</label>
                <input
                  type="text"
                  value={midtrans.clientKey}
                  onChange={e => setMidtrans({ ...midtrans, clientKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                  placeholder="SB-Mid-client-xxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Mode</label>
                <div className="flex gap-2">
                  {["sandbox", "production"].map(m => (
                    <button
                      key={m}
                      onClick={() => setMidtrans({ ...midtrans, mode: m })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${midtrans.mode === m ? "bg-orange-500 text-white" : "border border-slate-200 text-slate-500 hover:border-orange-300"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stripe */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">S</div>
                <div>
                  <h3 className="font-bold text-slate-900">Stripe</h3>
                  <p className="text-xs text-slate-400">Global payment gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {stripe.enabled
                  ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={11} /> Connected</span>
                  : <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full"><XCircle size={11} /> Disabled</span>
                }
                <button
                  onClick={() => setStripe({ ...stripe, enabled: !stripe.enabled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${stripe.enabled ? "bg-orange-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${stripe.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Secret Key</label>
                <div className="relative">
                  <input
                    type={showStripeKey ? "text" : "password"}
                    value={stripe.serverKey}
                    onChange={e => setStripe({ ...stripe, serverKey: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-orange-400"
                    placeholder="sk_test_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <button onClick={() => setShowStripeKey(!showStripeKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showStripeKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Publishable Key</label>
                <input
                  type="text"
                  value={stripe.publishableKey}
                  onChange={e => setStripe({ ...stripe, publishableKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                  placeholder="pk_test_xxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Mode</label>
                <div className="flex gap-2">
                  {["test", "live"].map(m => (
                    <button
                      key={m}
                      onClick={() => setStripe({ ...stripe, mode: m })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${stripe.mode === m ? "bg-orange-500 text-white" : "border border-slate-200 text-slate-500 hover:border-orange-300"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
              saving 
                ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                : success 
                ? "bg-green-500 text-white" 
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {saving ? "Saving..." : success ? "✓ Saved!" : "Save Configuration"}
          </button>
        </>
      )}
    </div>
  );
}