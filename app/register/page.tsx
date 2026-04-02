"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Sparkles, RefreshCw } from "lucide-react";
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

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState("/api/captcha");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Refresh Captcha
  const refreshCaptcha = () => {
    setCaptchaUrl(`/api/captcha?t=${Date.now()}`);
    setCaptchaInput("");
  };

  // --- Logic Register Email/Password ---
  const handleRegister = async () => {
    if (!captchaInput) {
      setError("Please complete the captcha verification");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Verifikasi captcha terlebih dahulu ke API verify
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

      // 2. Jika captcha valid, lanjutkan register ke Supabase
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        refreshCaptcha();
        setLoading(false);
      } else {
        // Setelah daftar berhasil, paksa ke halaman login
        // Gunakan window.location agar state benar-benar bersih
        window.location.href = "/login?message=Account created successfully";
      }
    } catch (err) {
      setError("Connection error. Please check your internet.");
      refreshCaptcha();
      setLoading(false);
    }
  };

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
        {/* Header - Margin dikurangi */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-1" suppressHydrationWarning>
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
            Create account
          </h1>
          <p className="text-slate-500 font-medium text-sm">Start tracking your performance</p>
        </motion.div>

        {/* Card - Padding dikurangi agar compact */}
        <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-5 md:p-6">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}

          {/* Social Register - Margin dikurangi */}
          <div className="mb-3">
            <button
              onClick={() => handleSocialLogin("google")}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <GoogleIcon size={20} />
              Sign up with Google
            </button>
          </div>

          {/* Divider - Margin dikurangi */}
          <div className="relative flex py-2 items-center mb-3">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or use email</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Form Inputs - Space dikurangi */}
          <div className="space-y-2.5">
            <motion.div variants={fadeUp} custom={2}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 text-slate-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </motion.div>

            {/* Captcha Section - Layout lebih rapat */}
            <motion.div variants={fadeUp} custom={5} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Security Check</label>
              <div className="flex gap-2 mb-2 items-center">
                <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm grow flex justify-center items-center p-1 min-h-[42px]">
                  <img src={captchaUrl} alt="captcha" className="h-full max-h-10 w-auto" />
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-slate-500 shadow-sm shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Type the code above"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
              />
            </motion.div>
          </div>

          {/* Submit - Margin dikurangi */}
          <motion.div variants={fadeUp} custom={6} className="mt-6">
            <button
              onClick={handleRegister}
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : <>Create Account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={fadeUp} custom={7} className="text-center text-slate-500 text-xs mt-4 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-bold inline-flex items-center gap-1 group transition-colors">
              Sign in <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}