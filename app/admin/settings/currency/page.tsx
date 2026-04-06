"use client";
import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";

const currencies = [
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
];

export default function CurrencySettingsPage() {
  const [selected, setSelected] = useState("USD");
  const [usdToIdr, setUsdToIdr] = useState("15800");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateSource, setRateSource] = useState("");

  const fetchLiveRate = async () => {
    setIsFetchingRate(true);
    try {
      const res = await fetch("/api/settings/exchange-rate", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && data.rate) {
        setUsdToIdr(data.rate.toString());
        setRateSource(`Live rate · ${new Date().toLocaleDateString("id-ID")}`);
      }
    } catch (err) {
      console.error("Failed to fetch live rate:", err);
    } finally {
      setIsFetchingRate(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings/currency");
        const data = await res.json();
        if (data.success) {
          setSelected(data.data.currency);
          setUsdToIdr(data.data.exchangeRate.toString());
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
        fetchLiveRate();
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const rate = parseFloat(usdToIdr);
      if (isNaN(rate) || rate <= 0) {
        setStatus("error");
        setErrorMsg("Exchange rate harus berupa angka positif");
        return;
      }

      const res = await fetch("/api/settings/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: selected,
          exchangeRate: rate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Gagal menyimpan");
      }
    } catch (error: any) {
      setStatus("error");
      setErrorMsg(error.message || "Terjadi kesalahan");
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Currency Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure display currency for pricing</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="animate-spin mx-auto text-orange-500 mb-3" size={32} />
          <p className="text-slate-500">Loading settings...</p>
        </div>
      ) : (
        <>
          {/* Currency Selector */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm mb-5">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">Select Currency</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelected(c.code)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl border transition text-left min-h-[88px] ${
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
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-900 text-sm">Exchange Rate</h3>
              <button
                onClick={fetchLiveRate}
                disabled={isFetchingRate}
                className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 disabled:opacity-50"
              >
                {isFetchingRate && <Loader2 size={12} className="animate-spin" />}
                {isFetchingRate ? "Updating..." : "↻ Refresh"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {rateSource || "Auto-fetched from market rate"}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1.5 block">1 USD =</label>
                <div className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-700 flex items-center justify-between">
                  <span>{parseFloat(usdToIdr).toLocaleString("id-ID")}</span>
                  {isFetchingRate && <Loader2 size={12} className="animate-spin text-orange-400" />}
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1.5 block">Currency</label>
                <div className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 bg-slate-50">
                  {selected}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Example: Pro 30 Days = ${19.99} USD ≈ {selected === "IDR"
                ? `Rp ${(19.99 * parseFloat(usdToIdr || "0")).toLocaleString("id-ID")}`
                : `${currencies.find((c) => c.code === selected)?.symbol}${(19.99).toFixed(2)}`}
            </p>
          </div>

          {/* Error Message */}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          {/* Success Message */}
          {status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <p className="text-sm text-green-700">✓ Currency settings saved successfully!</p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
              status === "success"
                ? "bg-green-500 text-white"
                : status === "saving"
                  ? "bg-orange-400 text-white cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {status === "saving" && <Loader2 size={16} className="animate-spin" />}
            {status === "success" && <Check size={16} />}
            {status === "success"
              ? "Saved!"
              : status === "saving"
                ? "Saving..."
                : "Save Changes"}
          </button>
        </>
      )}
    </div>
  );
}