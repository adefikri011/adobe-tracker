"use client";
import { useState, useEffect } from "react";

type PaymentStep = "select" | "form" | "processing" | "success";
type PaymentMethod = "card" | "bank" | "qris";

export function PaymentModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<PaymentStep>("select");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [progress, setProgress] = useState(0);
  const [qrisId, setQrisId] = useState("------");
  const [invoiceId, setInvoiceId] = useState("------");

  useEffect(() => {
    setQrisId(Math.random().toString(36).slice(2, 8).toUpperCase());
    setInvoiceId(Date.now().toString().slice(-6));
  }, []);

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

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {step === "select" && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upgrade to Pro</h2>
                <p className="text-gray-400 text-sm mt-0.5">Unlock unlimited access</p>
              </div>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition text-xl leading-none w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-gray-800">TrackStock Pro</div>
                <div className="text-gray-400 text-xs mt-0.5">Monthly · Unlimited results</div>
              </div>
              <div className="text-orange-500 font-bold text-xl">$9<span className="text-sm font-normal text-gray-400">/mo</span></div>
            </div>
            <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider">Choose payment method</p>
            <div className="space-y-3 mb-6">
              {[
                { id: "card" as PaymentMethod, icon: "💳", label: "Credit / Debit Card", sub: "Visa, Mastercard, JCB" },
                { id: "bank" as PaymentMethod, icon: "🏦", label: "Bank Transfer", sub: "BCA, Mandiri, BNI, BRI" },
                { id: "qris" as PaymentMethod, icon: "📱", label: "QRIS", sub: "GoPay, OVO, Dana, ShopeePay" },
              ].map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border transition text-left ${method === m.id ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}>
                  <span className="text-xl sm:text-2xl">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{m.label}</div>
                    <div className="text-xs text-gray-400 truncate">{m.sub}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${method === m.id ? "border-orange-500" : "border-gray-300"}`}>
                    {method === m.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("form")}
              className="w-full bg-orange-500 hover:bg-orange-600 transition py-3.5 rounded-xl font-semibold text-sm text-white">
              Continue →
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">🔒 Secured with 256-bit SSL encryption</p>
          </div>
        )}

        {step === "form" && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep("select")} className="text-gray-400 hover:text-gray-700 transition text-sm">← Back</button>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {method === "card" && "Card Details"}
                {method === "bank" && "Bank Transfer"}
                {method === "qris" && "Scan QRIS"}
              </h2>
            </div>

            {method === "card" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-4 sm:p-5 mb-2">
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="text-white/70 text-xs">TrackStock Pro</div>
                    <div className="text-white font-bold text-base sm:text-lg">VISA</div>
                  </div>
                  <div className="font-mono text-base sm:text-lg tracking-widest text-white/90 mb-3 sm:mb-4 break-all">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between text-xs text-white/70">
                    <span className="truncate mr-2">{cardName || "YOUR NAME"}</span>
                    <span className="flex-shrink-0">{expiry || "MM/YY"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Card Number</label>
                  <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-orange-400 transition" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Cardholder Name</label>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="JOHN DOE"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-orange-400 transition" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Expiry</label>
                    <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-orange-400 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">CVV</label>
                    <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="•••" type="password"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-orange-400 transition" />
                  </div>
                </div>
              </div>
            )}

            {method === "bank" && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5">
                  <p className="text-gray-400 text-xs mb-4 uppercase tracking-wider">Transfer to</p>
                  {[
                    { bank: "BCA", account: "1234567890", name: "PT TrackStock Indonesia" },
                    { bank: "Mandiri", account: "0987654321", name: "PT TrackStock Indonesia" },
                  ].map((b) => (
                    <div key={b.bank} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-800">{b.bank}</div>
                        <div className="text-gray-400 text-xs truncate">{b.name}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-sm text-orange-500">{b.account}</div>
                        <button onClick={() => navigator.clipboard.writeText(b.account)}
                          className="text-xs text-gray-300 hover:text-gray-600 transition">Copy</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-600">
                  💡 Transfer exactly <span className="font-bold">$9.00 (Rp 147.000)</span> — activated within 5 minutes.
                </div>
              </div>
            )}

            {method === "qris" && (
              <div className="text-center space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 inline-block mx-auto shadow-sm">
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div key={i} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm ${[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,8,15,22,29,36,10,17,24,31,38,11,18,25,32,39].includes(i) ? "bg-gray-900" : "bg-white"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-400 text-sm">Scan with GoPay, OVO, Dana, or ShopeePay</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-400">
                  QRIS ID: <span className="font-mono text-orange-500">TRK-{qrisId}</span>
                  <span className="ml-2 text-gray-300">· Expires in 10:00</span>
                </div>
              </div>
            )}

            <button onClick={handlePay}
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600 transition py-3.5 rounded-xl font-semibold text-sm text-white">
              {method === "card" && "Pay $9.00 →"}
              {method === "bank" && "I Have Transferred →"}
              {method === "qris" && "I Have Paid →"}
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">🔒 Demo mode — no real payment processed</p>
          </div>
        )}

        {step === "processing" && (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="w-16 h-16 border-4 border-gray-100 rounded-full" />
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">Processing Payment</h2>
            <p className="text-gray-400 text-sm mb-8">Please wait, do not close this window...</p>
            <div className="space-y-3 text-left mb-6">
              {[
                { label: "Verifying payment details", done: progress > 25 },
                { label: "Connecting to payment gateway", done: progress > 50 },
                { label: "Activating Pro subscription", done: progress > 75 },
                { label: "Finalizing your account", done: progress >= 100 },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs transition-all duration-500 ${s.done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-300"}`}>
                    {s.done ? "✓" : "○"}
                  </div>
                  <span className={`text-sm transition-all duration-500 ${s.done ? "text-gray-800" : "text-gray-300"}`}>{s.label}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }} />
            </div>
            <div className="text-orange-500 text-xs mt-2">{Math.round(progress)}%</div>
          </div>
        )}

        {step === "success" && (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Payment Successful!</h2>
            <p className="text-gray-400 text-sm mb-6">Welcome to TrackStock Pro 🎉</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 text-left mb-6 space-y-3">
              {[
                { label: "Plan", value: "TrackStock Pro" },
                { label: "Amount", value: "$9.00 / month" },
                { label: "Status", value: "✓ Active", green: true },
                { label: "Invoice", value: `#INV-${invoiceId}` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm gap-2">
                  <span className="text-gray-400 flex-shrink-0">{r.label}</span>
                  <span className={`${r.green ? "text-green-500 font-semibold" : "text-gray-800 font-medium"} text-right`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-left mb-6">
              {["Unlimited search results", "Advanced analytics & charts", "Export data CSV/Excel", "Priority support"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-green-500 text-xs flex-shrink-0">✓</span>{f}
                </div>
              ))}
            </div>
            <button onClick={handleSuccess}
              className="w-full bg-orange-500 hover:bg-orange-600 transition py-3.5 rounded-xl font-semibold text-sm text-white">
              Start Exploring Pro Features →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}