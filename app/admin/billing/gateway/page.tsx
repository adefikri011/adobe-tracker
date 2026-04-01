"use client";
import { useState } from "react";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function GatewayPage() {
  const [midtrans, setMidtrans] = useState({
    enabled: true, serverKey: "SB-Mid-server-xxxxxxxxxxxx", clientKey: "SB-Mid-client-xxxxxxxxxxxx", mode: "sandbox",
  });
  const [stripe, setStripe] = useState({
    enabled: false, secretKey: "sk_test_xxxxxxxxxxxxxxxxxxxx", publishableKey: "pk_test_xxxxxxxxxxxxxxxxxxxx", mode: "test",
  });
  const [showMidKey, setShowMidKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gateway Configuration</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">Configure payment gateway credentials</p>
      </div>

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
                value={stripe.secretKey}
                onChange={e => setStripe({ ...stripe, secretKey: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-orange-400"
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

      {/* Save */}
      <button
        onClick={handleSave}
        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${saved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
      >
        {saved ? "✓ Saved!" : "Save Configuration"}
      </button>
    </div>
  );
}