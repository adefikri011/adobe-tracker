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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const basePrice = 9; // USD price

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/session-status", { cache: "no-store" });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

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

    fetchAuthStatus();
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
    if (!isAuthenticated) {
      alert("Silakan login atau daftar dulu untuk melanjutkan pembelian.");
      router.push("/login");
      return;
    }

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

      if (res.status === 401) {
        alert("Silakan login atau daftar dulu untuk melanjutkan pembelian.");
        setShowPaymentModal(false);
        setSelectedPlan(null);
        setIsAuthenticated(false);
        router.push("/login");
        setIsProcessingPayment(false);
        return;
      }

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
        setIsProcessingPayment(false);
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
    <main className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold text-white">T</div>
          <div className="leading-tight">
            <span className="text-[11px] font-black text-slate-900">Track</span>
            <span className="text-[11px] font-black text-orange-500">Stock</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-slate-600 hover:text-slate-900 transition text-sm font-medium">Sign In</Link>
          <Link href="/register" className="bg-orange-500 hover:bg-orange-600 transition px-6 py-2 rounded-lg text-sm font-bold text-white">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-[950] text-slate-900 mb-4 tracking-tight">Choose your plan</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
            Start free and upgrade when you need more. No hidden fees, cancel anytime.
          </p>
          
          {/* Currency Indicator */}
          {!loadingSettings && currencySettings && (
            <div className="mt-6 inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-lg text-slate-600 text-sm">
              <span>{getCurrencySymbol()}</span>
              <span>Pricing in <strong>{currencySettings.currency}</strong></span>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {/* Free */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col hover:border-orange-300 hover:shadow-md transition-all">
            <div>
              <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-3">Free Plan</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-[900] text-slate-900">$0</span>
              </div>
              <div className="text-slate-500 text-sm mb-8 font-medium">Forever free · No credit card needed</div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    <span className={f.included ? "text-emerald-500" : "text-slate-300"}>
                      {f.included ? "✓" : "✗"}
                    </span>
                    <span className={f.included ? "text-slate-700" : "text-slate-400 line-through"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/register"
              className="block w-full text-center border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition py-3 rounded-xl text-sm font-bold text-slate-900 mt-auto">
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-slate-900 border border-slate-900 rounded-2xl p-8 flex flex-col relative overflow-hidden ring-2 ring-orange-500 shadow-xl shadow-orange-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                Most Popular
              </span>
            </div>
            <div>
              <div className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">Pro Plan</div>
              
              {loadingSettings ? (
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 size={20} className="animate-spin text-orange-500" />
                  <span className="text-slate-400 text-sm">Loading price...</span>
                </div>
              ) : (
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-[900] text-white">{getDisplayPrice().split(" ")[0]}</span>
                  {currencySettings?.currency === "IDR" && (
                    <span className="text-slate-400 text-sm mb-2">{getDisplayPrice().split(" ")[1]}</span>
                  )}
                  <span className="text-slate-400 text-sm mb-2">/month</span>
                </div>
              )}
              
              <div className="text-slate-400 text-sm mb-8 font-medium">
                Billed monthly · Cancel anytime
              </div>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-300">{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={handleUpgrade} disabled={loading || loadingSettings}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition py-3.5 rounded-xl text-sm font-bold text-white mt-auto shadow-lg shadow-orange-500/20">
              {loading ? "Processing..." : "Upgrade to Pro →"}
            </button>
            <p className="text-center text-slate-500 text-xs mt-3 font-medium">Demo mode · No real payment</p>
          </div>
        </div>

        {/* All Plans Section */}
        {plans.length > 0 && (
          <div className="mb-16 pt-8 border-t border-slate-200">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-[900] text-slate-900 mb-3 tracking-tight">Flexible Duration Plans</h2>
              <p className="text-slate-500 font-medium">Choose the plan that fits your needs</p>
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
                          ? "bg-slate-900 text-white ring-2 ring-orange-500 shadow-xl shadow-slate-900/10"
                          : "bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md"
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                            Most Popular
                          </span>
                        </div>
                      )}

                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mb-4 ${
                        isPopular
                          ? "bg-white/10 text-emerald-300"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Active
                      </span>

                      <h3 className={`text-sm sm:text-base font-bold leading-tight mb-1 ${
                        isPopular ? "text-white" : "text-slate-800"
                      }`}>
                        {plan.name}
                      </h3>

                      <p className={`text-xs mt-1 mb-4 ${
                        isPopular ? "text-slate-200" : "text-slate-400"
                      }`}>
                        {plan.durationDays} days access
                      </p>

                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-3xl sm:text-4xl md:text-5xl font-[900] tracking-tighter ${
                          isPopular ? "text-white" : "text-slate-900"
                        }`}>
                          {formatPrice(plan.finalPrice).split(" ")[0]}
                        </span>
                        {plan.price !== plan.finalPrice && (
                          <span className={`text-xs sm:text-sm line-through ${
                            isPopular ? "text-slate-400" : "text-slate-500"
                          }`}>
                            {formatPrice(plan.price)}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs sm:text-sm mb-6 sm:mb-7 md:mb-8 ${
                        isPopular ? "text-slate-300" : "text-slate-500"
                      }`}>
                        one-time payment
                      </p>

                      <div className={`w-full h-px mb-5 ${
                        isPopular ? "bg-white/10" : "bg-slate-100"
                      }`} />

                      <ul className={`space-y-2 sm:space-y-2.5 mb-6 sm:mb-7 md:mb-8 flex-1 min-h-[40px]`}>
                        {plan.features.length > 0 ? (
                          plan.features.map((feature, i) => (
                            <li
                              key={i}
                              className={`flex items-center gap-2 sm:gap-2.5 text-[12px] sm:text-[13px] font-medium ${
                                isPopular ? "text-slate-300" : "text-slate-600"
                              }`}
                            >
                              <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                                isPopular ? "bg-orange-500" : "bg-orange-100"
                              }`}>
                                <Check size={9} className={isPopular ? "text-white" : "text-orange-600"} strokeWidth={3.5} />
                              </span>
                              {feature}
                            </li>
                          ))
                        ) : (
                          <li className={`text-[12px] sm:text-[13px] font-medium ${
                            isPopular ? "text-slate-500" : "text-slate-400"
                          }`}>
                            Full platform access
                          </li>
                        )}
                      </ul>

                      <button
                        onClick={() => handleCheckout(plan.id)}
                        disabled={isProcessingPayment}
                        className={`w-full py-2.5 sm:py-3 md:py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-auto disabled:opacity-50 ${
                          isPopular
                            ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20"
                            : "bg-slate-900 hover:bg-orange-500 text-white"
                        }`}
                      >
                        {isProcessingPayment ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : !isAuthenticated ? (
                          "Login to Buy"
                        ) : (
                          <>
                            <Zap size={13} fill="currentColor" className="hidden sm:inline" />
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
        <div className="max-w-2xl mx-auto mt-20 pt-16 border-t border-slate-200">
          <h2 className="text-2xl md:text-3xl font-[900] text-slate-900 text-center mb-12 tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is the free plan really free?", a: "Yes, forever. No credit card required. You get 5 results per search and basic analytics." },
              { q: "Can I cancel anytime?", a: "Absolutely. Cancel your Pro subscription at any time with no questions asked." },
              { q: "How does the caching system work?", a: "Every search is saved to our PostgreSQL database. If someone searches the same keyword again, we return the cached result instantly — saving API quota and loading 10x faster." },
              { q: "Will I get real Adobe Stock data?", a: "In the full version, yes. The system integrates with Adobe Stock API with an intelligent cache layer to maximize the free API quota." },
            ].map((item) => (
              <div key={item.q} className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:bg-slate-100 transition-colors">
                <div className="font-bold text-slate-900 text-sm mb-2">{item.q}</div>
                <div className="text-slate-600 text-sm leading-relaxed font-medium">{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12 pb-8">
          <Link href="/" className="text-slate-500 hover:text-slate-700 transition text-sm font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Order Summary</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessingPayment}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <span className="text-slate-400">✕</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 space-y-8">
              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Order Details</h3>
                
                <div className="bg-slate-50 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Plan:</span>
                    <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Duration:</span>
                    <span className="font-bold text-slate-900">{selectedPlan.durationDays} days</span>
                  </div>
                  {selectedPlan.discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Discount:</span>
                      <span className="font-bold text-emerald-600">-{selectedPlan.discount}%</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                    <span className="font-bold text-slate-900">Total Price:</span>
                    <span className="text-2xl font-black text-orange-500">
                      {formatPrice(selectedPlan.finalPrice)}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                {selectedPlan.features.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">What's Included</h4>
                    <div className="space-y-2">
                      {selectedPlan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Payment Method</h3>
                
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
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-orange-200 bg-white"
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
                        <span className="font-bold text-slate-900">{method.label}</span>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <Check size={20} className="text-orange-500" />
                      )}
                    </label>
                  ))}
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  💡 All payments are securely processed through <strong>Midtrans</strong>
                </p>
              </div>

              {/* Security Note */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">🔒</span>
                <p className="text-xs sm:text-sm text-slate-700">
                  Your payment information is <strong>100% secure</strong> and encrypted. No card details are stored on our servers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessingPayment}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessingPayment}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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