"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Sparkles, RefreshCw, CheckCircle } from "lucide-react";
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
  const [isRegistered, setIsRegistered] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
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
        // 3. Setelah daftar berhasil, kirim email verification code
        try {
          const registerRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const registerData = await registerRes.json();

          if (!registerRes.ok) {
            setError(registerData.error || "Failed to send verification email");
            refreshCaptcha();
            setLoading(false);
            return;
          }

          // Ubah ke email verification screen
          setIsRegistered(true);
          setLoading(false);
        } catch (err) {
          setError("Failed to send verification email. Please try again.");
          refreshCaptcha();
          setLoading(false);
        }
      }
    } catch (err) {
      setError("Connection error. Please check your internet.");
      refreshCaptcha();
      setLoading(false);
    }
  };

  // --- Logic Verify Email ---
  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      setVerifyError("Please enter the verification code");
      return;
    }

    setVerifyLoading(true);
    setVerifyError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerifyError(data.error || "Failed to verify email");
        setVerifyLoading(false);
        return;
      }

      // Verification berhasil, redirect ke login
      window.location.href = "/login?message=Email verified successfully. Please login.";
    } catch (err) {
      setVerifyError("Connection error. Please try again.");
      setVerifyLoading(false);
    }
  };

  // --- Resend Verification Code ---
  const handleResendCode = async () => {
    setLoading(true);
    setVerifyError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setVerifyError("Failed to resend code");
      } else {
        setVerifyError(""); // Clear error on success
        setVerificationCode(""); // Clear input
      }
    } catch (err) {
      setVerifyError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSocialLogin = async (provider: "google") => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    setError("Failed to start OAuth flow. Please try again.");
    setLoading(false);
  };

  // If registered, show email verification screen
  if (isRegistered) {
    return (
      <section className="relative min-h-screen flex items-center justify-center px-4 bg-white overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-orange-50/20 to-white" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-[100px] -z-10 opacity-80" />

        <motion.div initial="hidden" animate="show" className="w-full max-w-md relative z-10" suppressHydrationWarning>
          {/* Header */}
          <motion.div variants={fadeUp} custom={0} className="text-center mb-6" suppressHydrationWarning>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              We sent a verification code to<br /><span className="text-slate-700 font-semibold">{email}</span>
            </p>
          </motion.div>

          {/* Card */}
          <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6">
            {verifyError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                <span className="font-bold">Error:</span> {verifyError}
              </motion.div>
            )}

            <motion.div variants={fadeUp} custom={2} className="space-y-4">
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

              {/* Verification Button */}
              <button
                onClick={handleVerifyEmail}
                disabled={verifyLoading || verificationCode.length !== 6}
                className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                {verifyLoading ? "Verifying..." : <>Verify Email <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
              </button>

              {/* Resend Code */}
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-sm text-center text-orange-500 hover:text-orange-600 font-semibold transition-colors disabled:opacity-50 w-full py-2"
              >
                {loading ? "Sending..." : "Resend Code"}
              </button>

              {/* Back Button */}
              <button
                onClick={() => {
                  setIsRegistered(false);
                  setVerificationCode("");
                  setVerifyError("");
                }}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors w-full py-2"
              >
                Back to Register
              </button>
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

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 bg-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-orange-50/20 to-white" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-[100px] -z-10 opacity-80" />

      <motion.div initial="hidden" animate="show" className="w-full max-w-md relative z-10" suppressHydrationWarning>
        {/* Header - Margin dikurangi */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-0" suppressHydrationWarning>
          <Link href="/" className="inline-flex justify-center mb-8 group">
            {logoUrl ? (
              // Ganti h-24 menjadi h-12 (atau angka lain yang lebih kecil)
              <img src={logoUrl} alt="TrackStock Logo" className="h-12 w-auto object-contain" />
            ) : (
              // Jangan lupa ganti juga di sini supaya konsisten
              <TrackStockLogo />
            )}
          </Link>
          <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-900 mb-0.5">
            Create account
          </h1>
          <p className="text-slate-500 font-medium text-sm">Start tracking your performance</p>
        </motion.div>

        {/* Card - Padding dikurangi agar compact */}
        <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-5 md:p-6 -mt-1">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-2 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}

          {/* Social Register - Margin dikurangi */}
          <div className="mb-1.5">
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
          <div className="relative flex py-0.5 items-center mb-1.5">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or use email</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Form Inputs - Space dikurangi */}
          <div className="space-y-1.5">
            <motion.div variants={fadeUp} custom={2}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 block ml-1">Full Name</label>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 block ml-1">Email Address</label>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 block ml-1">Password</label>
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
            <motion.div variants={fadeUp} custom={5} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Security Check</label>
              <div className="flex gap-2 mb-1 items-center">
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
          <motion.div variants={fadeUp} custom={6} className="mt-2">
            <button
              onClick={handleRegister}
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : <>Create Account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={fadeUp} custom={7} className="text-center text-slate-500 text-xs mt-1 font-medium">
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