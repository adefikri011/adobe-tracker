"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Check, Zap, Loader2, ArrowLeft, ShieldCheck,
  CreditCard, Building2, Wallet, Clock, Tag, Sparkles, ChevronRight
} from "lucide-react";
import { FiCheck, FiZap } from "react-icons/fi";
import jsPDF from "jspdf";
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

const formatFeatureName = (feature: string): string => {
  return feature
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const paymentMethods = [
  { id: "credit_card", label: "Credit / Debit Card", sub: "Visa, Mastercard, JCB, Amex", Icon: CreditCard },
  { id: "bank_transfer", label: "Bank Transfer", sub: "BCA, Mandiri, BNI, BRI", Icon: Building2 },
  { id: "e_wallet", label: "E-Wallet", sub: "GoPay, OVO, Dana, ShopeePay", Icon: Wallet },
];

const STEPS = ["Order Summary", "Payment", "Confirmation"];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");

  const [currentStep, setCurrentStep] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(15800);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [invoiceId] = useState(() => Math.floor(Math.random() * 900000 + 100000).toString());

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/session-status", { cache: "no-store" });
        setIsAuthenticated(res.ok);
      } catch { setIsAuthenticated(false); }
    };
    const fetchPlan = async () => {
      if (!planId) { setLoading(false); return; }
      try {
        const res = await fetch("/api/billing/plans");
        const data = await res.json();
        if (data && Array.isArray(data.plans)) {
          const foundPlan = data.plans.find((p: Plan) => p.id === planId);
          if (foundPlan) setPlan(foundPlan);
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      } finally { setLoading(false); }
    };
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/currency");
        const data = await res.json();
        if (data.success && data.data) {
          setCurrency(data.data.currency);
          setExchangeRate(data.data.exchangeRate);
        }
      } catch { setCurrency("USD"); setExchangeRate(15800); }
    };
    const fetchUserPlan = async () => {
      try {
        const res = await fetch("/api/user/plan");
        if (res.ok) {
          const data = await res.json();
          setIsPro(data.isPremium !== undefined ? data.isPremium : data.plan === "pro");
        }
      } catch (error) { console.error("Failed to fetch user plan:", error); }
    };
    fetchAuthStatus();
    fetchPlan();
    fetchSettings();
    fetchUserPlan();
  }, [planId]);

  const formatPrice = (priceUSD: number): string => {
    if (currency === "IDR") {
      const idrPrice = priceUSD * exchangeRate;
      return `Rp ${Math.round(idrPrice).toLocaleString("id-ID")}`;
    }
    return `$${priceUSD}`;
  };

  const handleConfirmPayment = async () => {
    if (!plan) return;
    if (!isAuthenticated) {
      alert("Silakan login atau daftar dulu untuk melanjutkan pembelian.");
      router.push("/login");
      return;
    }
    setIsProcessingPayment(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id, paymentMethod: selectedPaymentMethod }),
      });
      if (res.status === 401) {
        alert("Silakan login atau daftar dulu untuk melanjutkan pembelian.");
        setIsAuthenticated(false);
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.token) {
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: () => {
            setIsProcessingPayment(false);
            setCurrentStep(2);
          },
          onPending: () => {
            alert("Pembayaran tertunda");
            setIsProcessingPayment(false);
          },
          onError: () => {
            alert("Pembayaran gagal");
            setIsProcessingPayment(false);
          },
          onClose: () => { setIsProcessingPayment(false); },
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

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else router.back();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#fdf8f3" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{ border: "2px solid #fde8d0", borderTopColor: "#ea580c" }}
          />
          <p style={{ fontSize: 13, color: "#a8a29e", fontFamily: "'DM Sans', sans-serif" }}>
            Loading plan details...
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#fdf8f3" }}>
        <div className="text-center">
          <p style={{ color: "#57534e", fontSize: 16, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
            Plan tidak ditemukan
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: "10px 24px", background: "#ea580c", color: "#fff",
              borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600, fontSize: 14,
            }}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  /* ─── Step Bar ─── */
  const StepBar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 40 }}>
      {STEPS.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: done || active ? "#ea580c" : "#fff",
                  border: done || active ? "2px solid #ea580c" : "2px solid #e7e5e4",
                  color: done || active ? "#fff" : "#c4bfbb",
                  transition: "all 0.3s",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: active ? "0 0 0 4px rgba(234,88,12,0.12)" : "none",
                }}
              >
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                  fontFamily: "'DM Sans', sans-serif",
                  color: active ? "#1c1917" : done ? "#ea580c" : "#c4bfbb",
                  letterSpacing: "0.01em",
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 64, height: 2, margin: "0 8px", marginBottom: 20,
                  borderRadius: 999, background: "#f0ebe4", overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%", borderRadius: 999,
                    background: "linear-gradient(90deg, #ea580c, #fb923c)",
                    width: i < currentStep ? "100%" : "0%",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ─── Order Sidebar ─── */
  const OrderSidebar = () => (
    <div
      style={{
        background: "#1c1917",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid #292524",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "22px 24px",
          background: "#231f1c",
          borderBottom: "1px solid #292524",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* dot pattern */}
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.035,
            backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(234,88,12,0.18)", border: "1px solid rgba(234,88,12,0.3)",
              borderRadius: 999, padding: "3px 10px", marginBottom: 12,
            }}
          >
            <Sparkles size={9} style={{ color: "#fb923c" }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: "#fb923c", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
              Pro Plan
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                {plan.name}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                <Clock size={11} style={{ color: "#78716c" }} />
                <span style={{ fontSize: 12, color: "#78716c", fontFamily: "'DM Sans', sans-serif" }}>
                  {plan.durationDays} days access
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {plan.discount > 0 && (
                <div style={{ fontSize: 11, color: "#57534e", textDecoration: "line-through", fontFamily: "'DM Sans', sans-serif" }}>
                  {formatPrice(plan.price)}
                </div>
              )}
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fb923c", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1 }}>
                {formatPrice(plan.finalPrice)}
              </div>
              <div style={{ fontSize: 10, color: "#57534e", fontFamily: "'DM Sans', sans-serif" }}>one-time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div style={{ padding: "16px 22px", borderBottom: "1px solid #292524" }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#57534e", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
          Order Details
        </p>
        {[
          ["Plan", plan.name],
          ["Duration", `${plan.durationDays} days`],
          ["Devices", `${plan.deviceLimit} device${plan.deviceLimit !== 1 ? "s" : ""}`],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#78716c", fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#d6d3d1", fontFamily: "'DM Sans', sans-serif" }}>{v}</span>
          </div>
        ))}
        {plan.discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#34d399", fontFamily: "'DM Sans', sans-serif" }}>
              <Tag size={10} />Discount
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399", fontFamily: "'DM Sans', sans-serif" }}>
              -{plan.discount}%
            </span>
          </div>
        )}
        <div style={{ paddingTop: 12, marginTop: 4, borderTop: "1px solid #292524", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fb923c", fontFamily: "'DM Sans', sans-serif" }}>
            {formatPrice(plan.finalPrice)}
          </span>
        </div>
      </div>

      {/* Features */}
      {plan.features.length > 0 && (
        <div style={{ padding: "16px 22px" }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#57534e", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
            What's Included
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.features.map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Check size={8} style={{ color: "#34d399" }} strokeWidth={3} />
                </div>
                <span style={{ fontSize: 12, color: "#a8a29e", fontFamily: "'DM Sans', sans-serif" }}>
                  {formatFeatureName(feature)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #292524", padding: "10px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <ShieldCheck size={11} style={{ color: "#57534e" }} />
        <p style={{ fontSize: 10, color: "#57534e", fontFamily: "'DM Sans', sans-serif" }}>
          256-bit SSL · Powered by Midtrans
        </p>
      </div>
    </div>
  );

  /* ─── Step 0: Order Summary ─── */
  const Step0 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1c1917", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Review your order
        </h2>
        <p style={{ fontSize: 13, color: "#a8a29e", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
          Confirm the plan details before proceeding to payment.
        </p>
      </div>

      {/* Plan card */}
      <div
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
          border: "1.5px solid #fed7aa",
          borderRadius: 16,
          padding: "18px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#9a3412", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            {plan.name}
          </p>
          <p style={{ fontSize: 12, color: "#c2410c", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
            {plan.durationDays} days · One-time payment
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {plan.features.slice(0, 3).map((f, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 600,
                  background: "#fff", border: "1px solid #fed7aa",
                  color: "#c2410c", padding: "4px 10px", borderRadius: 999,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Check size={9} strokeWidth={3} />
                {formatFeatureName(f)}
              </span>
            ))}
            {plan.features.length > 3 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#ea580c", alignSelf: "center", fontFamily: "'DM Sans', sans-serif" }}>
                +{plan.features.length - 3} more
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {plan.discount > 0 && (
            <p style={{ fontSize: 12, color: "#a8a29e", textDecoration: "line-through", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
              {formatPrice(plan.price)}
            </p>
          )}
          <p style={{ fontSize: 26, fontWeight: 900, color: "#ea580c", lineHeight: 1.1, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            {formatPrice(plan.finalPrice)}
          </p>
          {plan.discount > 0 && (
            <span
              style={{
                display: "inline-block", fontSize: 10, fontWeight: 800,
                background: "#dcfce7", color: "#15803d",
                padding: "2px 8px", borderRadius: 999, marginTop: 4,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              -{plan.discount}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={() => setCurrentStep(1)}
        style={{
          width: "100%", padding: "15px 24px", borderRadius: 14,
          background: "#ea580c", border: "none", cursor: "pointer",
          color: "#fff", fontWeight: 800, fontSize: 15,
          fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.01em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 6px 24px -4px rgba(234,88,12,0.45)",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#dc4f08")}
        onMouseLeave={e => (e.currentTarget.style.background = "#ea580c")}
      >
        Continue to Payment
        <ChevronRight size={17} />
      </button>

      <button
        onClick={handleBack}
        style={{
          width: "100%", padding: "13px", borderRadius: 14,
          background: "transparent", border: "1.5px solid #e7e5e4",
          color: "#a8a29e", fontWeight: 600, fontSize: 14,
          fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#faf9f8")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        Back to Plans
      </button>
    </div>
  );

  /* ─── Step 1: Payment ─── */
  const Step1 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1c1917", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Payment method
        </h2>
        <p style={{ fontSize: 13, color: "#a8a29e", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
          Choose how you'd like to pay for your plan.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {paymentMethods.map(({ id, label, sub, Icon }) => {
          const selected = selectedPaymentMethod === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedPaymentMethod(id)}
              disabled={isProcessingPayment}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 22px", borderRadius: 14, textAlign: "left",
                border: selected ? "2px solid #ea580c" : "1.5px solid #e7e5e4",
                background: selected ? "#fff7ed" : "#fff",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: selected ? "#ffedd5" : "#f5f5f4",
                  color: selected ? "#ea580c" : "#a8a29e",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: selected ? "#1c1917" : "#44403c", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  {label}
                </p>
                <p style={{ fontSize: 12, color: selected ? "#c2410c" : "#a8a29e", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                  {sub}
                </p>
              </div>
              <div
                style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  border: selected ? "2px solid #ea580c" : "2px solid #d6d3d1",
                  background: selected ? "#ea580c" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                {selected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pay button */}
      <button
        onClick={handleConfirmPayment}
        disabled={isProcessingPayment || !isAuthenticated}
        style={{
          width: "100%", padding: "15px 24px", borderRadius: 14,
          background: isProcessingPayment ? "#f97316" : "#ea580c",
          border: "none", cursor: isProcessingPayment ? "not-allowed" : "pointer",
          color: "#fff", fontWeight: 800, fontSize: 15,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: isProcessingPayment ? "none" : "0 6px 24px -4px rgba(234,88,12,0.45)",
          opacity: (!isAuthenticated) ? 0.5 : 1,
          transition: "all 0.2s",
        }}
      >
        {isProcessingPayment ? (
          <><Loader2 className="animate-spin" size={17} /><span>Processing...</span></>
        ) : (
          <><Zap size={17} fill="currentColor" /><span>Pay {formatPrice(plan.finalPrice)}</span></>
        )}
      </button>

      <button
        onClick={() => setCurrentStep(0)}
        disabled={isProcessingPayment}
        style={{
          width: "100%", padding: "13px", borderRadius: 14,
          background: "transparent", border: "1.5px solid #e7e5e4",
          color: "#a8a29e", fontWeight: 600, fontSize: 14,
          fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          opacity: isProcessingPayment ? 0.5 : 1,
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>
    </div>
  );

  /* ─── Step 2: Confirmation ─── */
  const Step2 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div
          style={{
            width: 66, height: 66, borderRadius: "50%",
            background: "#f0fdf4", border: "2px solid #bbf7d0",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}
        >
          <FiCheck size={28} style={{ color: "#22c55e" }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1c1917", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Payment Successful!
        </h2>
        <p style={{ fontSize: 12, color: "#a8a29e", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>
          Welcome to MetricStock Pro 🎉
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => {
            const doc = new jsPDF({ unit: "pt", format: "a4" });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const margin = 48;
            const right = pageWidth - margin;
            const contentWidth = pageWidth - margin * 2;

            const COLOR_ORANGE: [number, number, number] = [234, 88, 12];
            const COLOR_TEXT: [number, number, number] = [28, 25, 23];
            const COLOR_MUTED: [number, number, number] = [168, 162, 158];
            const COLOR_BORDER: [number, number, number] = [240, 237, 232];
            const COLOR_SOFT: [number, number, number] = [250, 250, 249];
            const COLOR_GREEN: [number, number, number] = [34, 197, 94];

            const invoice = `#INV-${invoiceId}`;
            const generatedAt = new Date().toLocaleString();

            // Header
            doc.setFillColor(...COLOR_ORANGE);
            doc.rect(0, 0, pageWidth, 98, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.text("Receipt", margin, 56);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Invoice ${invoice}`, margin, 76);
            doc.text(generatedAt, right, 76, { align: "right" });

            // Card: Order Summary
            const cardX = margin;
            const cardY = 118;
            const cardPadding = 18;
            const cardW = contentWidth;
            const cardH = 170;

            doc.setDrawColor(...COLOR_BORDER);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(cardX, cardY, cardW, cardH, 14, 14, "FD");

            doc.setTextColor(...COLOR_MUTED);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("ORDER SUMMARY", cardX + cardPadding, cardY + 28);

            const summaryRows: Array<[string, string]> = [
              ["Plan", plan.name],
              ["Duration", `${plan.durationDays} days`],
              ["Status", "Active"],
              ["Invoice", invoice],
            ];

            const rowStartY = cardY + 52;
            const rowH = 22;
            summaryRows.forEach(([label, value], idx) => {
              const y = rowStartY + idx * rowH;
              doc.setTextColor(...COLOR_MUTED);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              doc.text(label, cardX + cardPadding, y);

              doc.setTextColor(...COLOR_TEXT);
              doc.setFont("helvetica", "bold");
              doc.text(value, cardX + cardW - cardPadding, y, { align: "right" });
            });

            // Divider
            doc.setDrawColor(...COLOR_BORDER);
            doc.line(cardX + cardPadding, cardY + 132, cardX + cardW - cardPadding, cardY + 132);

            // Total
            doc.setTextColor(...COLOR_MUTED);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("TOTAL", cardX + cardPadding, cardY + 154);
            doc.setTextColor(...COLOR_ORANGE);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text(formatPrice(plan.finalPrice), cardX + cardW - cardPadding, cardY + 154, { align: "right" });

            // Card: What's Included
            const features = plan.features.map((f) => formatFeatureName(f));

            const featuresX = margin;
            const featuresY = cardY + cardH + 16;
            const featuresW = contentWidth;
            const featuresPadding = 18;

            const innerW = featuresW - featuresPadding * 2;
            const gutter = 18;
            const colW = (innerW - gutter) / 2;
            const listStartY = featuresY + 52;

            // Pre-calc heights (masonry 2 cols)
            const items = features.map((feature) => ({
              feature,
              lines: doc.splitTextToSize(feature, colW - 30) as string[],
            }));

            const colCursor = [listStartY, listStartY] as [number, number];
            items.forEach((item) => {
              const targetCol = colCursor[0] <= colCursor[1] ? 0 : 1;
              const lineH = 14;
              colCursor[targetCol] += item.lines.length * lineH + 10;
            });

            const featuresH = Math.max(colCursor[0], colCursor[1]) - featuresY + 18;

            doc.setDrawColor(...COLOR_BORDER);
            doc.setFillColor(...COLOR_SOFT);
            doc.roundedRect(featuresX, featuresY, featuresW, featuresH, 14, 14, "FD");

            doc.setTextColor(...COLOR_MUTED);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("WHAT'S INCLUDED", featuresX + featuresPadding, featuresY + 28);

            // Reset cursors and render
            const renderCursor = [listStartY, listStartY] as [number, number];
            items.forEach((item) => {
              const col = renderCursor[0] <= renderCursor[1] ? 0 : 1;
              const x = featuresX + featuresPadding + col * (colW + gutter);
              const y = renderCursor[col];

              // Icon (green circle + check)
              doc.setFillColor(...COLOR_GREEN);
              doc.circle(x + 7, y - 5, 7, "F");
              doc.setTextColor(255, 255, 255);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(10);
              doc.text("✓", x + 4.2, y - 1);

              // Text
              doc.setTextColor(...COLOR_TEXT);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              doc.text(item.lines, x + 22, y);

              const lineH = 14;
              renderCursor[col] += item.lines.length * lineH + 10;
            });

            // Footer
            doc.setTextColor(...COLOR_MUTED);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text("Powered by Midtrans", margin, pageHeight - 44);
            doc.text("Thank you for your purchase.", right, pageHeight - 44, { align: "right" });

            doc.save(`receipt-INV-${invoiceId}.pdf`);
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #e7e5e4",
            background: "#fff",
            color: "#44403c",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
          }}
        >
          Download Receipt (PDF)
        </button>
      </div>

      {/* Receipt & Features Combined */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #f0ede8",
          padding: "22px 22px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 22,
            alignItems: "start",
          }}
        >
          {/* Receipt Section */}
          <div>
            <p
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#a8a29e",
                margin: 0,
                marginBottom: 14,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Receipt
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                ["Plan", plan.name],
                ["Duration", `${plan.durationDays} days`],
                ["Amount", formatPrice(plan.finalPrice)],
                ["Status", "Active"],
                ["Invoice", `#INV-${invoiceId}`],
              ].map(([l, v], idx, arr) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: idx < arr.length - 1 ? "1px solid #f0ede8" : "none",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#a8a29e", fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      fontFamily: "'DM Sans', sans-serif",
                      color: l === "Status" ? "#22c55e" : l === "Amount" ? "#ea580c" : "#1c1917",
                      textAlign: "right",
                      lineHeight: 1.1,
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div style={{ borderLeft: "1px solid #f0ede8", paddingLeft: 22 }}>
            <p
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#a8a29e",
                margin: 0,
                marginBottom: 14,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              What's Included
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#f0fdf4",
                      border: "1.5px solid #bbf7d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <FiCheck size={12} style={{ color: "#22c55e" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#57534e", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, lineHeight: 1.25 }}>
                    {formatFeatureName(f)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push("/admin/billing/history")}
        style={{
          width: "100%", padding: "13px 20px", borderRadius: 14,
          background: "#ea580c", border: "none", cursor: "pointer",
          color: "#fff", fontWeight: 700, fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 6px 24px -4px rgba(234,88,12,0.45)",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#dc4f08")}
        onMouseLeave={e => (e.currentTarget.style.background = "#ea580c")}
      >
        <FiZap size={15} style={{ color: "#fff" }} />
        Start Exploring Pro Features
      </button>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        .checkout-root { font-family: 'DM Sans', sans-serif !important; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up   { animation: fadeUp 0.45s ease both; }
        .fade-up-1 { animation: fadeUp 0.45s 0.06s ease both; }
        .fade-up-2 { animation: fadeUp 0.45s 0.12s ease both; }
        .fade-up-3 { animation: fadeUp 0.45s 0.18s ease both; }
      `}</style>

      <div className="checkout-root" style={{ height: "100vh", background: "#fdf8f3", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <Navbar isPro={isPro} planLoading={false} onUpgradeClick={() => {}} isGuest={!isAuthenticated} />

        <main
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "40px 20px 20px",
            overflow: "hidden",
            flex: 1,
          }}
        >
          


          {/* Step bar */}
          <div className="fade-up-1">
            <StepBar />
          </div>

          {/* Grid */}
          <div
            className="fade-up-2"
            style={{
              display: "grid",
              gridTemplateColumns: currentStep < 2 ? "1fr 380px" : "1fr",
              gap: 24,
              alignItems: "start",
            }}
          >
            {/* Main card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                border: "1px solid #f0ede8",
                padding: "32px",
                boxShadow: "0 1px 12px rgba(0,0,0,0.04)",
              }}
            >
              {currentStep === 0 && <Step0 />}
              {currentStep === 1 && <Step1 />}
              {currentStep === 2 && <Step2 />}
            </div>

            {/* Sidebar */}
            {currentStep < 2 && (
              <div className="fade-up-3" style={{ position: "sticky", top: 32 }}>
                <OrderSidebar />
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}