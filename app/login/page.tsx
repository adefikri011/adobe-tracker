"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, Sparkles, RefreshCw } from "lucide-react";
import GoogleIcon from "../components/icons/GoogleIcon";

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

  // Refresh Captcha
  const refreshCaptcha = () => {
    setCaptchaUrl(`/api/captcha?t=${Date.now()}`);
    setCaptchaInput("");
  };

  // --- Logic Email/Password Login ---
  const handleLogin = async () => {
    if (!captchaInput) {
      setError("Please complete the captcha verification");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Verifikasi captcha terlebih dahulu
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

      // Jika captcha valid, lanjutkan login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setError(error.message);
        refreshCaptcha();
        setLoading(false);
      } else {
        router.push("/dashboard");
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

      <motion.div initial="hidden" animate="show" className="w-full max-w-md relative z-10">
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight">TrackStock</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-900 mb-2">
            Welcome back
          </h1>
          <p className="text-slate-500 font-medium">Sign in to track your performance</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-8 md:p-10">
          
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}

          {/* Social Button */}
          <div className="mb-6">
            <button
              onClick={() => handleSocialLogin("google")}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-700 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <GoogleIcon size={20} />
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or use email</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <motion.div variants={fadeUp} custom={2}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </motion.div>

            {/* Captcha Verification Section */}
            <motion.div variants={fadeUp} custom={4} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Human Verification
              </label>
              <div className="flex gap-2 mb-3 items-center">
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm grow flex justify-center items-center p-1 min-h-[50px]">
                  <img src={captchaUrl} alt="captcha" className="h-full max-h-12 w-auto" onError={(e) => { e.currentTarget.src = `/api/captcha?t=${Date.now()}`; }} />
                </div>
                <button 
                  type="button" 
                  onClick={refreshCaptcha}
                  className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-slate-500 shadow-sm"
                  title="Refresh Captcha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Type the characters above"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 transition-all"
              />
            </motion.div>
          </div>

          {/* Submit */}
          <motion.div variants={fadeUp} custom={5} className="mt-8">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : (
                <> Sign In <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /> </>
              )}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={fadeUp} custom={6} className="text-center text-slate-500 text-sm mt-6 font-medium">
            Don't have an account?{" "}
            <Link href="/register" className="text-orange-500 hover:text-orange-600 font-bold transition-colors inline-flex items-center gap-1 group">
              Sign up free <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}