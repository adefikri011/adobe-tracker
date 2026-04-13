"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
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

export default function VerifyResetCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);
  const [logoSize, setLogoSize] = useState("h-12 w-12");

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

    const fetchLogoSize = async () => {
      try {
        const response = await fetch("/api/admin/settings/logo-size");
        if (response.ok) {
          const data = await response.json();
          setLogoSize(data.logoSize);
        }
      } catch (error) {
        console.error("Error fetching logo size:", error);
      }
    };

    fetchLogo();
    fetchLogoSize();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Code must contain only numbers");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to reset password page
        router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${code}`);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && code.length === 6) {
      handleKeyPress(e);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const isExpired = timeLeft === 0;

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 bg-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-orange-50/20 to-white" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-[100px] -z-10 opacity-80" />

      <motion.div initial="hidden" animate="show" className="w-full max-w-md relative z-10" suppressHydrationWarning>
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-2.5" suppressHydrationWarning>
          <Link href="/" className="inline-flex justify-center mb-6 group">
            {logoUrl ? (
              <img src={logoUrl} alt="TrackStock Logo" className="h-12 w-12 object-contain" />
            ) : (
              <TrackStockLogo />
            )}
          </Link>
          <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-900 mb-0.5">
            Verify Your Code
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Enter the 6-digit code sent to{" "}
            <span className="font-mono font-semibold text-slate-700">{email}</span>
          </p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6 md:p-8">

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}

          <motion.div variants={fadeUp} custom={2} className="space-y-2.5">
            {/* Code Input */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">
                Verification Code
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  disabled={isExpired}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-center text-2xl font-mono tracking-widest text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Timer */}
            <div className={`text-center text-sm font-semibold p-3 rounded-xl ${
              isExpired 
                ? "bg-red-50 text-red-600" 
                : timeLeft < 300 
                  ? "bg-yellow-50 text-yellow-600" 
                  : "bg-blue-50 text-blue-600"
            }`}>
              {isExpired ? (
                <span>⏰ Code has expired. Please request a new one.</span>
              ) : (
                <span>Time remaining: {formatTime(timeLeft)}</span>
              )}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={fadeUp} custom={3} className="mt-6">
            <button
              onClick={handleVerify}
              disabled={loading || isExpired || code.length !== 6}
              className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? "Verifying..." : (
                <>
                  Verify Code
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={fadeUp} custom={4} className="text-center text-slate-500 text-xs mt-4 font-medium">
            <Link
              href="/forgot-password"
              className="text-orange-500 hover:text-orange-600 font-bold transition-colors"
            >
              Request a new code
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}
