"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Check, Zap } from "lucide-react";

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

interface CurrencySettings {
  currency: string;
  exchangeRate: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  discount: number;
  durationDays: number;
  features: string[];
}

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const basePrice = 9; // USD price

  useEffect(() => {
    // Fetch currency settings
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/currency");
        const data = await res.json();
        if (data.success) {
          setCurrencySettings(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch currency settings:", error);
        // Fallback to USD
        setCurrencySettings({ currency: "USD", exchangeRate: 15800 });
      } finally {
        setLoadingSettings(false);
      }
    };

    // Fetch plans
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/billing/plans");
        const data = await res.json();
        if (data && Array.isArray(data.plans)) {
          const activePlans = data.plans.filter(
            (p: any) => p.isActive && p.price > 0
          );
          setPlans(activePlans);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchSettings();
    fetchPlans();
  }, []);

  const getDisplayPrice = () => {
    if (!currencySettings) return "$9";

    const { currency, exchangeRate } = currencySettings;

    if (currency === "IDR") {
      const idrPrice = basePrice * exchangeRate;
      return `Rp ${Math.round(idrPrice).toLocaleString("id-ID")}`;
    }

    return `$${basePrice}`;
  };

  const getCurrencySymbol = () => {
    return currencySettings?.currency === "IDR" ? "🇮🇩" : "🇺🇸";
  };

  const formatPrice = (priceUSD: number): string => {
    if (!currencySettings) return `$${priceUSD}`;
    
    const { currency, exchangeRate } = currencySettings;
    if (currency === "IDR") {
      const idrPrice = priceUSD * exchangeRate;
      return `Rp ${Math.round(idrPrice).toLocaleString("id-ID")}`;
    }
    return `$${priceUSD}`;
  };

  const handleCheckout = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    
    setIsProcessingPayment(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ 
          planId: selectedPlan.id,
          paymentMethod: selectedPaymentMethod 
        }),
      });
      const data = await res.json();
      if (data.token) {
        setShowPaymentModal(false);
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: () => (window.location.href = "/dashboard"),
          onPending: () => alert("Payment pending"),
          onError: () => alert("Payment failed"),
          onClose: () => {
            setIsProcessingPayment(false);
            setSelectedPlan(null);
          },
        });
      } else {
        alert("Failed to create transaction");
      }
    } catch (error) {
      console.error(error);
      alert("Error processing payment");
      setIsProcessingPayment(false);
    }
  };

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
          
          {/* Currency Indicator */}
          {!loadingSettings && currencySettings && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-white/60 text-sm">
              <span>{getCurrencySymbol()}</span>
              <span>Pricing in <strong>{currencySettings.currency}</strong></span>
            </div>
          )}
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
              
              {loadingSettings ? (
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 size={20} className="animate-spin text-orange-400" />
                  <span className="text-white/40 text-sm">Loading price...</span>
                </div>
              ) : (
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-bold">{getDisplayPrice().split(" ")[0]}</span>
                  {currencySettings?.currency === "IDR" && (
                    <span className="text-white/40 text-sm mb-2">{getDisplayPrice().split(" ")[1]}</span>
                  )}
                  <span className="text-white/40 text-sm mb-2">/month</span>
                </div>
              )}
              
              <div className="text-white/30 text-sm mb-8">
                {currencySettings?.currency === "IDR" 
                  ? "Billed monthly · Cancel anytime" 
                  : "Billed monthly · Cancel anytime"}
              </div>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    <span className="text-green-400">✓</span>
                    <span className="text-white/70">{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={handleUpgrade} disabled={loading || loadingSettings}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition py-3.5 rounded-xl text-sm font-semibold mt-auto">
              {loading ? "Processing..." : "Upgrade to Pro →"}
            </button>
            <p className="text-center text-white/20 text-xs mt-3">Demo mode · No real payment</p>
          </div>
        </div>

        {/* All Plans Section */}
        {plans.length > 0 && (
          <div className="mb-16 pt-8 border-t border-white/10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Flexible Duration Plans</h2>
              <p className="text-white/40">Choose the plan that fits your needs</p>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-orange-500" size={40} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan, idx) => {
                  const isPopular = idx === 1;
                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col rounded-2xl p-6 transition-all duration-200 ${
                        isPopular
                          ? "bg-gradient-to-b from-orange-500/15 to-orange-900/5 border-2 border-orange-500 shadow-xl shadow-orange-500/10"
                          : "bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-white/8"
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-orange-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                            Most Popular
                          </span>
                        </div>
                      )}

                      <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                        isPopular ? "text-orange-400" : "text-white/50"
                      }`}>
                        {plan.name}
                      </div>

                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold text-white">
                          {formatPrice(plan.finalPrice).split(" ")[0]}
                        </span>
                        {currencySettings?.currency === "IDR" && (
                          <span className="text-white/40 text-sm">{formatPrice(plan.finalPrice).split(" ")[1]}</span>
                        )}
                      </div>

                      <p className="text-white/30 text-sm mb-6">
                        {plan.durationDays} days • one-time payment
                      </p>

                      {plan.discount > 0 && (
                        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-lg mb-4 w-fit">
                          <span className="text-xs font-bold text-emerald-400">
                            Save {plan.discount}% ({formatPrice(plan.price - plan.finalPrice)})
                          </span>
                        </div>
                      )}

                      <div className="w-full h-px bg-white/10 mb-5" />

                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.length > 0 ? (
                          plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                              <Check size={14} className="text-orange-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-white/50">Full platform access</li>
                        )}
                      </ul>

                      <button
                        onClick={() => handleCheckout(plan.id)}
                        disabled={isProcessingPayment}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${
                          isPopular
                            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                        }`}
                      >
                        {isProcessingPayment ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <>
                            <Zap size={13} fill="currentColor" />
                            Get Started
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/10 px-6 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Order Summary</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white/40">✕</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-8 space-y-8">
              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Order Details</h3>
                
                <div className="bg-white/5 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Plan:</span>
                    <span className="font-bold text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Duration:</span>
                    <span className="font-bold text-white">{selectedPlan.durationDays} days</span>
                  </div>
                  {selectedPlan.discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Discount:</span>
                      <span className="font-bold text-emerald-400">-{selectedPlan.discount}%</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                    <span className="font-bold text-white">Total Price:</span>
                    <span className="text-2xl font-black text-orange-500">
                      {formatPrice(selectedPlan.finalPrice)}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                {selectedPlan.features.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">What's Included</h4>
                    <div className="space-y-2">
                      {selectedPlan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-white/70">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Payment Method</h3>
                
                <div className="space-y-3">
                  {[
                    { id: "credit_card", label: "Credit/Debit Card", icon: "💳" },
                    { id: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
                    { id: "e_wallet", label: "E-Wallet (OVO/DANA)", icon: "📱" },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-white/10 hover:border-white/20 bg-white/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        disabled={isProcessingPayment}
                        className="w-5 h-5 text-orange-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xl">{method.icon}</span>
                        <span className="font-bold text-white">{method.label}</span>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <Check size={20} className="text-orange-500" />
                      )}
                    </label>
                  ))}
                </div>

                <p className="text-xs text-white/40 mt-3">
                  💡 All payments are securely processed through <strong>Midtrans</strong>
                </p>
              </div>

              {/* Security Note */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">🔒</span>
                <p className="text-xs text-white/70">
                  Your payment information is <strong>100% secure</strong> and encrypted. No card details are stored on our servers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessingPayment}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessingPayment}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={16} fill="currentColor" />
                      Continue to Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}