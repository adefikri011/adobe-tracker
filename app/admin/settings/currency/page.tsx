"use client";
import { useState } from "react";
import { Check } from "lucide-react";

const currencies = [
  { code: "USD", name: "US Dollar",       symbol: "$",  flag: "🇺🇸" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "EUR", name: "Euro",             symbol: "€",  flag: "🇪🇺" },
  { code: "GBP", name: "British Pound",    symbol: "£",  flag: "🇬🇧" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "MYR", name: "Malaysian Ringgit",symbol: "RM", flag: "🇲🇾" },
];

export default function CurrencySettingsPage() {
  const [selected, setSelected] = useState("USD");
  const [usdToIdr, setUsdToIdr] = useState("15800");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Currency Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure display currency for pricing</p>
      </div>

      {/* Currency Selector */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-900 mb-4 text-sm">Select Currency</h3>
        <div className="grid grid-cols-2 gap-3">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelected(c.code)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                selected === c.code
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 hover:border-orange-200 hover:bg-slate-50"
              }`}
            >
              <span className="text-2xl">{c.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{c.code}</p>
                <p className="text-xs text-slate-400">{c.name}</p>
              </div>
              <span className="text-sm font-bold text-slate-500">{c.symbol}</span>
              {selected === c.code && (
                <Check size={14} className="text-orange-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Exchange Rate */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-900 mb-1 text-sm">Exchange Rate</h3>
        <p className="text-xs text-slate-400 mb-4">Used for currency conversion display</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1.5 block">1 USD =</label>
            <input
              type="number"
              value={usdToIdr}
              onChange={e => setUsdToIdr(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1.5 block">Currency</label>
            <div className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 bg-slate-50">
              {selected}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Example: Pro 30 Days = ${19.99} USD ≈ {selected === "IDR" ? `Rp ${(19.99 * parseFloat(usdToIdr || "0")).toLocaleString("id-ID")}` : `${currencies.find(c => c.code === selected)?.symbol}${(19.99).toFixed(2)}`}
        </p>
      </div>

      <button
        onClick={handleSave}
        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
          saved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}