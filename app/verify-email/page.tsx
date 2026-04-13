"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, CheckCircle, RefreshCw } from "lucide-react";
import TrackStockLogo from "@/icons/brand";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || sessionStorage.getItem("unverified_email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(!emailFromQuery);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch logo dari admin settings
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/admin/logos?sectionType=land");
        if (response.ok) {
          const data = await response.json();
          setLogoUrl(data.fileUrl);
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
      }
    };

    fetchLogo();
  }, []);

  const handleResendCode = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend code");
      } else {
        setSuccess("Code sent! Check your email.");
        setVerificationCode("");
      }
    } catch (err) {
      setError("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send verification code");
        setLoading(false);
        return;
      }

      setSuccess("Verification code sent! Check your email.");
      setShowEmailInput(false);
      setLoading(false);
    } catch (err) {
      setError("Failed to send verification code");
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify email");
        setLoading(false);
        return;
      }

      setSuccess("Email verified successfully!");
      setTimeout(() => {
        router.push("/login?message=Email verified successfully. Please login.");
      }, 1500);
    } catch (err) {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 bg-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-orange-50/20 to-white" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-[100px] -z-10 opacity-80" />

      <motion.div initial="hidden" animate="show" className="w-full max-w-md relative z-10" suppressHydrationWarning>
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-6" suppressHydrationWarning>
          <Link href="/" className="inline-flex justify-center mb-6 group">
            {logoUrl ? (
              <img src={logoUrl} alt="TrackStock Logo" className="h-12 w-12 object-contain" />
            ) : (
              <TrackStockLogo />
            )}
          </Link>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            {showEmailInput ? "Enter your email to get a verification code" : `We sent a code to ${email}`}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-green-50 border border-green-100 text-green-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span className="font-bold">✓</span> {success}
            </motion.div>
          )}

          <motion.div variants={fadeUp} custom={2} className="space-y-4">
            {showEmailInput ? (
              <>
                {/* Email Input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                </div>

                {/* Send Code Button */}
                <button
                  onClick={handleSendVerification}
                  disabled={loading || !email}
                  className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading ? "Sending..." : <>Send Code <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
                </button>
              </>
            ) : (
              <>
                {/* Verification Code Input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-center text-3xl font-black tracking-widest focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-2 ml-1">Enter the 6-digit code sent to your email</p>
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerifyEmail}
                  disabled={loading || verificationCode.length !== 6}
                  className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying..." : <>Verify Email <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
                </button>

                {/* Resend Code */}
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-center text-orange-500 hover:text-orange-600 font-semibold transition-colors disabled:opacity-50 w-full py-2"
                >
                  {loading ? "Sending..." : "Resend Code"}
                </button>

                {/* Change Email */}
                <button
                  onClick={() => {
                    setShowEmailInput(true);
                    setVerificationCode("");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors w-full py-2"
                >
                  Use Different Email
                </button>
              </>
            )}

            {/* Back Links */}
            {!showEmailInput && (
              <div className="text-center text-sm">
                <Link href="/login" className="text-slate-500 hover:text-slate-700 font-medium">
                  Back to Login
                </Link>
              </div>
            )}
          </motion.div>

          {/* Info Note */}
          <motion.div variants={fadeUp} custom={3} className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700">
              <span className="font-bold">Note:</span> Code expires in 15 minutes. Check your spam folder if you don't see the email.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
