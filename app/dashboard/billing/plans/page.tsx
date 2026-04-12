"use client";
import { useState, useEffect } from "react";
import { Check, Zap, Loader2, ChevronDown, X } from "lucide-react";
import { Navbar } from "../../_components/Navbar";

interface Plan {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  discount: number;
  durationDays: number;
  deviceLimit: number;
  suspendDurationMinutes: number;
  features: string[];
}

// Helper function untuk extract jumlah hari dari text
const extractDays = (text: string): number => {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[0]) : 0;
};

const formatFeatureName = (feature: string): string => {
  return feature
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, bank transfers, and local payment methods via Midtrans.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! Our Free plan lets you try out the platform with limited searches per day. No credit card required.",
  },
  {
    q: "How does the discount work?",
    a: "Discounts are automatically applied at checkout. The final price shown already reflects any active discount.",
  },
];

// Payment Details Modal Component
interface PaymentDetailsModalProps {
  plan: Plan;
  currency: string;
  exchangeRate: number;
  selectedPaymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  plan,
  currency,
  exchangeRate,
  selectedPaymentMethod,
  onPaymentMethodChange,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const formatPrice = (priceUSD: number): string => {
    if (currency === "IDR") {
      const idrPrice = priceUSD * exchangeRate;
      return `Rp ${Math.round(idrPrice).toLocaleString("id-ID")}`;
    }
    return `$${priceUSD}`;
  };

  const paymentMethods = [
    { id: "credit_card", label: "Credit/Debit Card", icon: "💳" },
    { id: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
    { id: "e_wallet", label: "E-Wallet (OVO/DANA)", icon: "📱" },
  ];

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Order Summary</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-6 sm:py-8 space-y-8">
          
          {/* Order Summary Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Order Details</h3>
            
            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Plan:</span>
                <span className="font-bold text-slate-900">{plan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Duration:</span>
                <span className="font-bold text-slate-900">{plan.durationDays} days</span>
              </div>
              {plan.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Discount:</span>
                  <span className="font-bold text-emerald-600">-{plan.discount}%</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="font-bold text-slate-900">Total Price:</span>
                <span className="text-2xl font-black text-orange-500">
                  {formatPrice(plan.finalPrice)}
                </span>
              </div>
            </div>

            {/* Features List */}
            {plan.features.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">What's Included</h4>
                <div className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{formatFeatureName(feature)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Payment Method</h3>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => (
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
                    onChange={(e) => onPaymentMethodChange(e.target.value)}
                    disabled={isLoading}
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
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
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
  );
};

export default function UserPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(15800);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [planExpiry, setPlanExpiry] = useState<Date | null>(null);
  const [remainingDays, setRemainingDays] = useState<number>(0);
  
  // Payment Details Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    // Check auth status
    const fetchAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/session-status", { cache: "no-store" });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    // Fetch user's plan status
    const fetchUserPlan = async () => {
      try {
        const res = await fetch("/api/user/plan");
        if (res.ok) {
          const data = await res.json();
          const isProPlan = data.isPremium !== undefined ? data.isPremium : data.plan === "pro";
          setIsPro(isProPlan);
          setUserPlan(data.plan || "free");
          
          // Calculate remaining days if planExpiry exists
          if (data.planExpiry) {
            const expiry = new Date(data.planExpiry);
            const today = new Date();
            const diff = expiry.getTime() - today.getTime();
            const days = Math.ceil(diff / (1000 * 3600 * 24));
            setRemainingDays(Math.max(0, days));
            setPlanExpiry(expiry);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user plan:", error);
      } finally {
        setPlanLoading(false);
      }
    };

    // Fetch currency settings
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/currency");
        const data = await res.json();
        if (data.success && data.data) {
          setCurrency(data.data.currency);
          setExchangeRate(data.data.exchangeRate);
        }
      } catch {
        // Default to USD if error
        setCurrency("USD");
        setExchangeRate(15800);
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
        } else {
          setPlans([]);
        }
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    fetchAuthStatus();
    fetchUserPlan();
    fetchSettings();
    fetchPlans();
  }, []);

  const handleCheckout = async (planId: string) => {
    if (!isAuthenticated) {
      alert("Silakan login atau daftar dulu untuk melanjutkan pembelian.");
      window.location.href = "/login";
      return;
    }

    // Find the plan
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    // Open payment details modal instead of directly checking out
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
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      if (data.token) {
        setShowPaymentModal(false);
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: () => (window.location.href = "/admin/billing/history"),
          onPending: () => alert("Pembayaran tertunda"),
          onError: () => alert("Pembayaran gagal"),
          onClose: () => {
            setIsProcessingPayment(false);
            setSelectedPlan(null);
          },
        });
      } else {
        alert("Gagal membuat transaksi");
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error(error);
      alert("Error memproses pembayaran");
      setIsProcessingPayment(false);
    }
  };

  const formatPrice = (priceUSD: number): string => {
    if (currency === "IDR") {
      const idrPrice = priceUSD * exchangeRate;
      return `Rp ${Math.round(idrPrice).toLocaleString("id-ID")}`;
    }
    return `$${priceUSD}`;
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`nav button[style*="background: linear-gradient(135deg, #f97316, #ea580c)"] {
          display: none !important;
        }
      `}</style>

      <Navbar isPro={isPro} planLoading={planLoading} onUpgradeClick={() => {}} isGuest={!isAuthenticated} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 md:pb-24 pt-10 sm:pt-12 md:pt-14">

        {/* Hero */}
        <div className="text-center mb-10 sm:mb-12 md:mb-14">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-[950] text-slate-900 tracking-tight mb-2 sm:mb-3">
            Simple, transparent{" "}
            <span className="text-orange-500">pricing.</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base font-medium max-w-md mx-auto">
            Pay only for what you need. No hidden fees, no auto-renewals.
          </p>
          
          {/* Currency Badge */}
          {currency && (
            <div className="mt-4 inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg text-xs sm:text-sm text-slate-600">
              <span>{currency === "IDR" ? "🇮🇩" : "🇺🇸"}</span>
              <span>Pricing in <strong>{currency}</strong></span>
            </div>
          )}
        </div>

        {/* Plan Cards */}
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-10 sm:mb-12 md:mb-14">
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
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Active + Discount row */}
                  <div className="flex items-center justify-between mb-4">
                    {isPro && extractDays(userPlan) === extractDays(plan.name) && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          isPopular
                            ? "bg-white/10 text-emerald-300"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Active
                      </span>
                    )}
                    {!isPro && plan.name.toLowerCase() === "free" && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          isPopular
                            ? "bg-white/10 text-emerald-300"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Active
                      </span>
                    )}
                    {!userPlan || (!isPro && plan.name.toLowerCase() !== "free") || (isPro && extractDays(userPlan) !== extractDays(plan.name)) ? (
                      <div />
                    ) : null}
                    {plan.discount > 0 && (
                      <span className="text-[10px] font-black bg-orange-500 text-white px-2 py-1 rounded-full uppercase tracking-wider">
                        -{plan.discount}%
                      </span>
                    )}
                  </div>

                  {/* Plan name + duration */}
                  <h3
                    className={`text-sm sm:text-base font-bold leading-tight ${
                      isPopular ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className={`text-xs mt-1 mb-4 ${
                    isPopular ? "text-slate-200" : "text-slate-400"
                  }`}>
                    {plan.durationDays} days access
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`text-3xl sm:text-4xl md:text-5xl font-[900] tracking-tighter ${
                        isPopular ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {formatPrice(plan.finalPrice)}
                    </span>
                    {plan.price !== plan.finalPrice && (
                      <span className="text-xs sm:text-sm text-slate-500 line-through">
                        {formatPrice(plan.price)}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs sm:text-sm mb-6 sm:mb-7 md:mb-8 ${
                    isPopular ? "text-slate-300" : "text-slate-500"
                  }`}>
                    one-time payment
                  </p>

                  {/* Divider */}
                  <div
                    className={`w-full h-px mb-5 ${
                      isPopular ? "bg-white/10" : "bg-slate-100"
                    }`}
                  />

                  {/* Features */}
                  <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-7 md:mb-8 flex-1 min-h-[40px]">
                    {/* Device Limit */}
                    <li
                      className={`flex items-center gap-2 sm:gap-2.5 text-[12px] sm:text-[13px] font-bold ${
                        isPopular ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                          isPopular ? "bg-orange-500" : "bg-orange-100"
                        }`}
                      >
                        <Check
                          size={9}
                          className={
                            isPopular ? "text-white" : "text-orange-600"
                          }
                          strokeWidth={3.5}
                        />
                      </span>
                      {plan.deviceLimit} Device{plan.deviceLimit !== 1 ? 's' : ''}
                    </li>

                    {/* Features */}
                    {plan.features.length > 0 ? (
                      plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className={`flex items-center gap-2 sm:gap-2.5 text-[12px] sm:text-[13px] font-medium ${
                            isPopular ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                              isPopular ? "bg-orange-500" : "bg-orange-100"
                            }`}
                          >
                            <Check
                              size={9}
                              className={
                                isPopular ? "text-white" : "text-orange-600"
                              }
                              strokeWidth={3.5}
                            />
                          </span>
                          {formatFeatureName(feature)}
                        </li>
                      ))
                    ) : (
                      <li
                        className={`text-[12px] sm:text-[13px] font-medium ${
                          isPopular ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Full platform access
                      </li>
                    )}
                  </ul>

                  {/* CTA */}
                  {/* Get Started Button atau Active Info */}
                  {isPro && extractDays(userPlan) === extractDays(plan.name) ? (
                    <div className="w-full py-4 sm:py-5 md:py-6 px-4 rounded-xl text-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 shadow-sm">
                      {/* Header dengan checkmark */}
                      <div className="inline-flex items-center justify-center gap-2 mb-3 px-3 py-1.5 bg-emerald-100 rounded-full">
                        <span className="text-sm">✓</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-700">Plan Aktif</span>
                      </div>

                      {/* Plan name */}
                      <p className="text-sm sm:text-base font-black text-emerald-900 mb-3 uppercase tracking-wider">
                        {userPlan}
                      </p>

                      {/* Countdown visual */}
                      <div className="mb-3 p-2.5 bg-white/60 rounded-lg border border-emerald-200">
                        <div className="text-xl sm:text-2xl font-black text-emerald-600 mb-0.5">
                          {remainingDays}
                        </div>
                        <p className="text-xs text-emerald-600 font-semibold">hari tersisa</p>
                      </div>

                      {/* End date */}
                      {planExpiry && (
                        <p className="text-xs sm:text-[13px] text-emerald-600 font-medium leading-relaxed">
                          Berakhir <br />
                          <span className="font-bold text-emerald-700">
                            {planExpiry.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => !isPro && handleCheckout(plan.id)}
                      disabled={showPaymentModal || isProcessingPayment || !isAuthenticated || isPro}
                      className={`w-full py-2.5 sm:py-3 md:py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-auto ${
                        isPro
                          ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-400"
                          : isPopular
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
                          <Zap size={13} className="hidden sm:inline" fill="currentColor" />
                          Get Started
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">
            No active plans available at the moment.
          </div>
        )}

        {/* FAQ Header */}
        <div className="mt-16 sm:mt-20 md:mt-24 text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-[900] text-slate-900 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-3">
            Everything you need to know about the product and billing.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-x-12 md:gap-y-8">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border-b border-slate-100 py-4 sm:py-5 md:py-6 cursor-pointer hover:border-slate-200 transition-colors"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex-1">{faq.q}</h4>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 flex-shrink-0 transition-transform duration-200 mt-0.5 ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openFaq === i && (
                <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 leading-relaxed font-medium">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Payment Details Modal */}
        {showPaymentModal && selectedPlan && (
          <PaymentDetailsModal
            plan={selectedPlan}
            currency={currency}
            exchangeRate={exchangeRate}
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={setSelectedPaymentMethod}
            onConfirm={handleConfirmPayment}
            onClose={() => setShowPaymentModal(false)}
            isLoading={isProcessingPayment}
          />
        )}

      </main>
    </div>
  );
}