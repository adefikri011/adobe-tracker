"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to process request");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSubmit();
    }
  };

  if (submitted) {
    return (
      <section className="relative min-h-screen flex items-center justify-center px-4 bg-white overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-orange-50/20 to-white" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-[100px] -z-10 opacity-80" />

        <motion.div
          className="w-full max-w-md relative z-10"
          initial="hidden"
          animate="show"
          variants={{
            show: {
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="text-center mb-4" // Sedikit menambah margin bottom
          >
            <Link href="/" className="inline-flex justify-center mb-10 group w-full">
            {logoUrl ? (
              <img
                src={logoUrl}
                className="h-15 w-auto object-contain" 
                alt="Logo"
              />
            ) : (
              <div className="h-32 w-32">
                <TrackStockLogo /> 
              </div>
            )}
          </Link>
            {/* Ukuran diperbesar dari text-3xl ke text-5xl */}
            <h1 className="text-5xl font-[900] text-slate-900 mb-3">
              Check Your Email
            </h1>

            {/* Ukuran diperbesar dari text-sm ke text-lg */}
            <p className="text-slate-500 font-medium text-lg">
              We've sent a verification code to:
            </p>

            {/* Ukuran diperbesar dari text-sm ke text-xl agar email lebih menonjol */}
            <p className="text-xl font-mono text-slate-600 mt-2 break-all font-bold">
              {email}
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            custom={1}
            className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6 md:p-8 mt-6"
          >
            <div className="bg-orange-50 border border-orange-200/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-700">
                <span className="text-orange-600 font-semibold">Next step:</span> Please check your email inbox (and spam folder) for a 6-digit verification code. The code will expire in 15 minutes.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="text-center mt-6"
          >
            <button
              onClick={() => router.push("/verify-reset-code?email=" + encodeURIComponent(email))}
              className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mb-4"
            >
              Continue to Verification
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              href="/login"
              className="text-slate-500 hover:text-orange-600 text-sm transition-colors font-medium"
            >
              Back to Login
            </Link>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 bg-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-orange-50/20 to-white" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-[100px] -z-10 opacity-80" />

      <motion.div initial="hidden" animate="show" className="w-full max-w-md relative z-10" suppressHydrationWarning>
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-2.5" suppressHydrationWarning>
          <Link href="/" className="inline-flex justify-center mb-10 group w-full">
            {logoUrl ? (
              <img
                src={logoUrl}
                className="h-15 w-auto object-contain" 
                alt="Logo"
              />
            ) : (
              <div className="h-32 w-32">
                <TrackStockLogo /> 
              </div>
            )}
          </Link>
          <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-900 mb-0.5">
            Forgot Password?
          </h1>
          <p className="text-slate-500 font-medium text-sm">No worries! Enter your email and we'll send you a verification code to reset your password.</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6 md:p-8">

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}

          {/* Email Input */}
          <motion.div variants={fadeUp} custom={2} className="space-y-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-orange-50/70 border border-orange-200/50 rounded-xl p-3 text-xs text-slate-700">
              <p>
                <span className="text-orange-600 font-semibold">Note:</span> Password reset is only available for accounts created with email. If you signed up with Google, please use Google to login.
              </p>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={fadeUp} custom={3} className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : (
                <>
                  Send Code
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={fadeUp} custom={4} className="text-center text-slate-500 text-xs mt-4 font-medium">
            Remember your password?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">
              Back to Login
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}
