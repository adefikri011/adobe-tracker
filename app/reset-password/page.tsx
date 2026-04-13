"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get params safely
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize params once on mount
  useEffect(() => {
    const emailParam = searchParams?.get("email");
    const codeParam = searchParams?.get("code");
    
    if (emailParam && codeParam) {
      setEmail(emailParam);
      setCode(codeParam);
    }
    
    setMounted(true);
  }, [searchParams]);
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

  const validatePassword = (): boolean => {
    if (!password || !confirmPassword) {
      return false;
    }

    if (password.length < 8) {
      return false;
    }

    if (password !== confirmPassword) {
      return false;
    }

    return true;
  };

  const getValidationError = (): string => {
    if (!password || !confirmPassword) {
      return "Please fill in both password fields";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return "";
  };

  const handleResetPassword = async () => {
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login?message=Password reset successfully. Please login with your new password.");
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <Link href="/" className="inline-flex justify-center group">
                {logoUrl ? (
                  <img src={logoUrl} alt="TrackStock Logo" className="h-12 w-12 object-contain" />
                ) : (
                  <TrackStockLogo />
                )}
              </Link>
            </div>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-white">✓</span>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-[900] text-slate-900 mb-2">Password Reset!</h1>
            <p className="text-slate-500 font-medium">Your password has been successfully reset. Redirecting to login...</p>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  // Don't render form until mounted and params are loaded
  if (!mounted) {
    return null;
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
          <Link href="/" className="inline-flex justify-center mb-6 group">
            {logoUrl ? (
              <img src={logoUrl} alt="TrackStock Logo" className="h-12 w-12 object-contain" />
            ) : (
              <TrackStockLogo />
            )}
          </Link>
          <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-900 mb-0.5">
            Reset Password
          </h1>
          <p className="text-slate-500 font-medium text-sm">Create a strong new password for your account</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} custom={1} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2rem] p-6 md:p-8">

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}

          <div className="space-y-2.5">
            {/* Password Fields */}
            <motion.div variants={fadeUp} custom={3}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          password.length >= 8
                            ? "w-full bg-green-500"
                            : password.length >= 6
                              ? "w-2/3 bg-yellow-500"
                              : "w-1/3 bg-red-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div variants={fadeUp} custom={4}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs mt-1 ${password === confirmPassword ? "text-green-500" : "text-red-500"}`}>
                      {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                  )}
                </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div variants={fadeUp} custom={5} className="mt-6">
            <button
              onClick={handleResetPassword}
              disabled={loading || !validatePassword()}
              className="group relative w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-70 transition-all py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? "Resetting..." : (
                <>
                  Reset Password
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={fadeUp} custom={6} className="text-center text-slate-500 text-xs mt-4 font-medium">
            Back to login?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">
              Sign in here
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}
