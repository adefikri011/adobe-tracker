"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, Sparkles, RefreshCw } from "lucide-react";
import GoogleIcon from "../components/icons/GoogleIcon";
import TrackStockLogo from "@/icons/brand";


// --- Animasi Variants ---
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

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState("/api/captcha");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State baru untuk Suspend Modal
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendMsg, setSuspendMsg] = useState("");
  const [suspendSecondsLeft, setSuspendSecondsLeft] = useState(0);
  const [suspendFlowActive, setSuspendFlowActive] = useState(false);

  const getSecondsFromUntil = (until: string | null) => {
    if (!until) return 0;
    const untilMs = new Date(until).getTime();
    if (Number.isNaN(untilMs)) return 0;
    return Math.max(0, Math.ceil((untilMs - Date.now()) / 1000));
  };

  const clearSuspendQuery = () => {
    const params = new URLSearchParams(window.location.search);
    const hasSuspendQuery = params.get("error") || params.get("minutes") || params.get("until");
    if (!hasSuspendQuery) return;

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);
  };

  // Refresh Captcha
  const refreshCaptcha = () => {
    setCaptchaUrl(`/api/captcha?t=${Date.now()}`);
    setCaptchaInput("");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorType = params.get("error");
    const minutes = params.get("minutes");
    const until = params.get("until");

    const checkAndSetSuspendTime = async () => {
      try {
        const res = await fetch("/api/auth/session-status", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "suspended") {
            if (typeof data.secondsLeft === "number" && data.secondsLeft > 0) {
              setSuspendSecondsLeft(data.secondsLeft);
              return;
            }

            const fromServerUntil = getSecondsFromUntil(data.suspendedUntil ?? null);
            if (fromServerUntil > 0) {
              setSuspendSecondsLeft(fromServerUntil);
              return;
            }

            if (data.minutesLeft) {
              setSuspendSecondsLeft(Number(data.minutesLeft) * 60);
              return;
            }
          }

          if (data.status !== "suspended") {
            setSuspendSecondsLeft(0);
            setSuspendFlowActive(false);
            clearSuspendQuery();
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch suspend time from server");
      }

      const fromUntil = getSecondsFromUntil(until);
      if (fromUntil > 0) {
        setSuspendSecondsLeft(fromUntil);
        return;
      }

      setSuspendSecondsLeft(minutes ? parseInt(minutes, 10) * 60 : 300);
    };

    if (errorType === "double_login") {
      const fallbackSeconds = getSecondsFromUntil(until) || (minutes ? parseInt(minutes, 10) * 60 : 300);
      const msg = minutes
        ? `Account detected login from a second device. For security, this account is temporarily blocked for ${minutes} minutes.`
        : "Account detected login from a second device. For security, this account is temporarily blocked.";
      setSuspendMsg(msg);
      setSuspendFlowActive(true);
      setSuspendSecondsLeft(fallbackSeconds);
      checkAndSetSuspendTime();
      setShowSuspendModal(true);
    }

    if (errorType === "suspended") {
      const fallbackSeconds = getSecondsFromUntil(until) || (minutes ? parseInt(minutes, 10) * 60 : 300);
      const msg = minutes
        ? `Your account is currently suspended. Please wait ${minutes} more minutes.`
        : "Your account is currently suspended.";
      setSuspendMsg(msg);
      setSuspendFlowActive(true);
      setSuspendSecondsLeft(fallbackSeconds);
      checkAndSetSuspendTime();
      setShowSuspendModal(true);
    }

    if (errorType === "session_expired") {
      setError("Your session has expired. Please login again.");
      setSuspendFlowActive(false);
      clearSuspendQuery();
    }

    if (errorType === "device_conflict") {
      const fallbackSeconds = getSecondsFromUntil(until) || (minutes ? parseInt(minutes, 10) * 60 : 300);
      const msg = minutes
        ? `Your session on this device has been terminated because the account was found active on another device. Account is temporarily blocked for ${minutes} minutes.`
        : "Your session on this device has been terminated because the account was found active on another device.";
      setSuspendMsg(msg);
      setSuspendFlowActive(true);
      setSuspendSecondsLeft(fallbackSeconds);
      checkAndSetSuspendTime();
      setShowSuspendModal(true);
    }
  }, []);

  useEffect(() => {
    if (suspendSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSuspendSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [suspendSecondsLeft]);

  useEffect(() => {
    if (!suspendFlowActive || suspendSecondsLeft > 0) return;

    setShowSuspendModal(false);
    clearSuspendQuery();
    setSuspendFlowActive(false);
  }, [suspendFlowActive, suspendSecondsLeft]);

  // --- Logic Email/Password Login ---
  const handleLogin = async () => {
    if (!captchaInput) {
      setError("Please complete the captcha verification");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Verifikasi captcha
      const captchaResponse = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captchaInput }),
      });

      const captchaData = await captchaResponse.json();

      if (!captchaData.valid) {
        setError("Invalid captcha. Please try again.");
        refreshCaptcha();
        setLoading(false);
        return;
      }

      // 2. Login lewat API Internal kita (Agar fitur 1 Device & Suspend Jalan)
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await loginRes.json();

      if (!loginRes.ok) {
        // Check jika suspended status
        if (data.error === "SUSPENDED_ACCOUNT") {
          setSuspendMsg("Your account has been suspended due to unauthorized access attempts. Please contact support for assistance.");
          setSuspendFlowActive(true);
          setSuspendSecondsLeft(0);
          setShowSuspendModal(true);
          refreshCaptcha();
          setLoading(false);
          return;
        }
        
        // Cek jika errornya karena Double Login atau Suspend
        if (data.error === "DOUBLE_LOGIN" || data.error === "SUSPENDED") {
          setSuspendMsg(data.message);
          const fromApiUntil = getSecondsFromUntil(data.suspendedUntil ?? null);
          const fromApiMinutes = data.minutesLeft ? Number(data.minutesLeft) * 60 : 0;
          const nextSeconds = fromApiUntil || fromApiMinutes || 300;
          setSuspendFlowActive(true);
          setSuspendSecondsLeft(nextSeconds);
          setShowSuspendModal(true);
        } else {
          setError(data.message || data.error);
        }
        refreshCaptcha();
        setLoading(false);
      } else {
        const redirectTo = data?.redirectTo === "/admin" ? "/admin" : "/dashboard";
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      refreshCaptcha();
      setLoading(false);
    }
  };

  // --- Logic Social Login ---
  const handleSocialLogin = async (provider: "google") => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
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
        {/* Header - Margin dikurangi biar rapi */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-2.5" suppressHydrationWarning>
          <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
            <TrackStockLogo />
            <div className="flex flex-col text-left">
              <span className="font-[950] text-xl tracking-tighter text-slate-900 leading-none">
                Track<span className="text-orange-500">Stock</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mt-1">
                Analytics Pro
              </span>
            </div>
          </Link>
          <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-900 mb-0.5">
            Welcome back
          </h1>
          <p className="text-slate-500 font-medium text-sm">Sign in to track your performance</p>
        </motion.div>

        {/* Card - Padding dikurangi agar lebih compact */}
        <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6 md:p-8">

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}

          {/* Social Button - Margin dikurangi */}
          <div className="mb-3">
            <button
              onClick={() => handleSocialLogin("google")}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <GoogleIcon size={20} />
              Continue with Google
            </button>
          </div>

          {/* Divider - Margin disesuaikan */}
          <div className="relative flex py-2 items-center mb-3">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or use email</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Inputs - Space dikurangi */}
          <div className="space-y-2.5">
            <motion.div variants={fadeUp} custom={2}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </motion.div>

            {/* Captcha Verification Section - Layout lebih rapat */}
            <motion.div variants={fadeUp} custom={4} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Security Check
              </label>
              <div className="flex gap-2 mb-2 items-center">
                <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm grow flex justify-center items-center p-1 min-h-[42px]">
                  <img src={captchaUrl} alt="captcha" className="h-full max-h-10 w-auto" onError={(e) => { e.currentTarget.src = `/api/captcha?t=${Date.now()}`; }} />
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-slate-500 shadow-sm shrink-0"
                  title="Refresh Captcha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Type the code above"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500 transition-all"
              />
            </motion.div>
          </div>

          {/* Submit - Margin dikurangi */}
          <motion.div variants={fadeUp} custom={5} className="mt-6">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : (
                <> Sign In <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /> </>
              )}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={fadeUp} custom={6} className="text-center text-slate-500 text-xs mt-4 font-medium">
            Don't have an account?{" "}
            <Link href="/register" className="text-orange-500 hover:text-orange-600 font-bold transition-colors inline-flex items-center gap-1 group">
              Sign up free <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>

      {/* POP-UP WARNING (Logic tetap sama) */}
      <AnimatePresence>
        {showSuspendModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border border-orange-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-[900] text-slate-900 mb-2 tracking-tight">Access Denied!</h2>
              <p className="text-slate-500 font-medium mb-6 leading-relaxed text-sm">{suspendMsg}</p>
              {suspendSecondsLeft > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                  <p className="text-xs text-slate-600 font-semibold mb-2 uppercase tracking-wide">Time Remaining</p>
                  <p className="text-4xl font-[900] text-orange-600 font-mono tracking-tight">
                    {String(Math.floor(suspendSecondsLeft / 60)).padStart(2, "0")}:
                    {String(suspendSecondsLeft % 60).padStart(2, "0")}
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowSuspendModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-black shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all active:scale-95"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}