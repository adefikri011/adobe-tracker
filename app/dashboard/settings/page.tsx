"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "../_components/Navbar";
import { AVAILABLE_TIMEZONES } from "../../../lib/geolocation";

type TabKey = "account" | "security" | "preferences";

type ProfileData = {
  name: string;
  email: string;
  avatar: string | null;
  accountStatus: string;
  planSlug: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

const TABS: Array<{ key: TabKey; label: string; desc: string }> = [
  { key: "account", label: "Account", desc: "Nama, email, status akun" },
  { key: "security", label: "Security", desc: "Ganti password akun" },
  { key: "preferences", label: "Preferences", desc: "Timezone dan format waktu" },
];

function getInitials(name: string, email: string): string {
  if (name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function UserSettingsPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabKey>("account");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [timeFormat, setTimeFormat] = useState("24h");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingAccount, setSavingAccount] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [accountMsg, setAccountMsg] = useState<Message | null>(null);
  const [securityMsg, setSecurityMsg] = useState<Message | null>(null);
  const [prefsMsg, setPrefsMsg] = useState<Message | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [authRes, profileRes, timezoneRes] = await Promise.all([
          supabase.auth.getUser(),
          fetch("/api/user/profile", { cache: "no-store" }),
          fetch("/api/settings/timezone", { cache: "no-store" }),
        ]);

        const user = authRes.data?.user;
        if (!user || !profileRes.ok) {
          window.location.href = "/login";
          return;
        }

        const profilePayload = await profileRes.json();
        const profileData = profilePayload?.data;

        const name = profileData?.fullName || user.user_metadata?.full_name || user.user_metadata?.name || "User";
        const userEmail = user.email || profileData?.email || "-";

        setProfile({
          name,
          email: userEmail,
          avatar: user.user_metadata?.avatar_url || null,
          accountStatus: profileData?.accountStatus || "active",
          planSlug: profileData?.plan?.slug || "free",
        });
        setIsPro(Boolean(profileData?.plan?.isPremium));

        setFullName(name);
        setEmail(userEmail);

        if (timezoneRes.ok) {
          const timezonePayload = await timezoneRes.json();
          setTimezone(timezonePayload?.data?.timezone || "Asia/Jakarta");
          setTimeFormat(timezonePayload?.data?.timeFormat || "24h");
        }
      } catch {
        window.location.href = "/login";
      } finally {
        setLoading(false);
        setPlanLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  const initials = useMemo(() => {
    if (!profile) return "US";
    return getInitials(profile.name, profile.email);
  }, [profile]);

  const planLabel = useMemo(() => {
    if (!profile) return "Free";
    const slug = (profile.planSlug || "free").toLowerCase();
    if (slug === "free") return "Free";

    const number = slug.match(/(\d+)/)?.[1];
    if (number) return `Pro ${number} Hari`;
    return "Pro";
  }, [profile]);

  const timezonePreview = useMemo(() => {
    try {
      return new Date().toLocaleString("id-ID", {
        timeZone: timezone,
        hour12: timeFormat === "12h",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  }, [timezone, timeFormat]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setAccountMsg(null);
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setAccountMsg({ type: "error", text: "Nama minimal 2 karakter." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAccountMsg({ type: "error", text: "Format email tidak valid." });
      return;
    }

    const nameChanged = trimmedName !== profile.name;
    const emailChanged = trimmedEmail !== profile.email.toLowerCase();

    if (!nameChanged && !emailChanged) {
      setAccountMsg({ type: "success", text: "Tidak ada perubahan data." });
      return;
    }

    setSavingAccount(true);
    try {
      if (nameChanged) {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: trimmedName }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || "Gagal update nama.");
      }

      if (emailChanged) {
        const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
        if (error) throw new Error(error.message || "Gagal update email.");
      }

      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, name: trimmedName, email: trimmedEmail };
      });

      setAccountMsg({
        type: "success",
        text: emailChanged
          ? "Profil tersimpan. Cek email baru untuk verifikasi perubahan email."
          : "Profil berhasil diperbarui.",
      });
    } catch (error) {
      setAccountMsg({
        type: "error",
        text: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan profil.",
      });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);

    if (newPassword.length < 8) {
      setSecurityMsg({ type: "error", text: "Password minimal 8 karakter." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: "error", text: "Konfirmasi password tidak sama." });
      return;
    }

    setSavingSecurity(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message || "Gagal update password.");

      setNewPassword("");
      setConfirmPassword("");
      setSecurityMsg({ type: "success", text: "Password berhasil diperbarui." });
    } catch (error) {
      setSecurityMsg({
        type: "error",
        text: error instanceof Error ? error.message : "Terjadi kesalahan saat update password.",
      });
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsMsg(null);
    setSavingPrefs(true);

    try {
      const res = await fetch("/api/settings/timezone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone, timeFormat }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Gagal menyimpan preferensi.");
      }

      setPrefsMsg({ type: "success", text: "Preferences berhasil disimpan." });
    } catch (error) {
      setPrefsMsg({
        type: "error",
        text: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan preferences.",
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar isPro={isPro} planLoading={planLoading} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-8 w-72 bg-slate-200 rounded" />
            <div className="h-4 w-60 bg-slate-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        isPro={isPro}
        planLoading={planLoading}
        userEmail={profile?.email}
        userName={profile?.name}
        userAvatar={profile?.avatar || undefined}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <section
          className="relative overflow-hidden rounded-3xl border border-orange-200/60 p-5 sm:p-7"
          style={{
            background:
              "radial-gradient(circle at 85% -10%, rgba(251,146,60,0.18) 0%, rgba(255,255,255,0.98) 45%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))",
          }}
        >
          <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl bg-orange-300/30" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm"
                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
              >
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white font-black text-lg tracking-wide">{initials}</span>
                )}
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-orange-600/90">
                  User Settings
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Pengaturan Akun</h1>
                <p className="text-sm sm:text-base text-slate-500 mt-1">Kelola account, security, dan preferensi kamu.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-sm font-bold border border-orange-200">
                {planLabel}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold border border-slate-200 uppercase">
                {profile?.accountStatus || "active"}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
          <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm h-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="w-full text-left px-3 py-3 rounded-2xl transition mb-1"
                style={{
                  background: activeTab === tab.key ? "rgba(249,115,22,0.12)" : "transparent",
                  border: activeTab === tab.key ? "1px solid rgba(249,115,22,0.35)" : "1px solid transparent",
                }}
              >
                <p className="text-sm font-extrabold text-slate-800">{tab.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{tab.desc}</p>
              </button>
            ))}
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            {activeTab === "account" && (
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Account</h2>
                  <p className="text-sm text-slate-500 mt-1">Update nama dan email akun kamu.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nama</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    placeholder="Nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    placeholder="you@example.com"
                  />
                  <p className="text-xs text-slate-400 mt-2">Perubahan email membutuhkan verifikasi di inbox email baru.</p>
                </div>

                {accountMsg && <InlineMessage message={accountMsg} />}

                <button
                  type="submit"
                  disabled={savingAccount}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
                >
                  {savingAccount ? "Menyimpan..." : "Simpan Account"}
                </button>
              </form>
            )}

            {activeTab === "security" && (
              <form onSubmit={handleSaveSecurity} className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Security</h2>
                  <p className="text-sm text-slate-500 mt-1">Ganti password akun untuk menjaga keamanan.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    placeholder="Minimal 8 karakter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Konfirmasi Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    placeholder="Ulangi password"
                  />
                </div>

                {securityMsg && <InlineMessage message={securityMsg} />}

                <button
                  type="submit"
                  disabled={savingSecurity}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
                >
                  {savingSecurity ? "Menyimpan..." : "Update Password"}
                </button>
              </form>
            )}

            {activeTab === "preferences" && (
              <form onSubmit={handleSavePreferences} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Preferences</h2>
                  <p className="text-sm text-slate-500 mt-1">Atur timezone dan format jam sesuai kebutuhan.</p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-600">Preview Waktu</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{timezonePreview}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 bg-white"
                  >
                    {AVAILABLE_TIMEZONES.map((tz) => (
                      <option key={tz.zone} value={tz.zone}>
                        {`${tz.flag} ${tz.label} (${tz.offset})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Format Waktu</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTimeFormat("24h")}
                      className="px-3 py-2.5 rounded-xl border text-sm font-bold transition"
                      style={{
                        background: timeFormat === "24h" ? "rgba(249,115,22,0.12)" : "white",
                        borderColor: timeFormat === "24h" ? "rgba(249,115,22,0.35)" : "rgba(226,232,240,1)",
                        color: timeFormat === "24h" ? "#c2410c" : "#475569",
                      }}
                    >
                      24 Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeFormat("12h")}
                      className="px-3 py-2.5 rounded-xl border text-sm font-bold transition"
                      style={{
                        background: timeFormat === "12h" ? "rgba(249,115,22,0.12)" : "white",
                        borderColor: timeFormat === "12h" ? "rgba(249,115,22,0.35)" : "rgba(226,232,240,1)",
                        color: timeFormat === "12h" ? "#c2410c" : "#475569",
                      }}
                    >
                      12 Hour
                    </button>
                  </div>
                </div>

                {prefsMsg && <InlineMessage message={prefsMsg} />}

                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
                >
                  {savingPrefs ? "Menyimpan..." : "Simpan Preferences"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InlineMessage({ message }: { message: Message }) {
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-sm font-semibold"
      style={{
        color: message.type === "success" ? "#166534" : "#b91c1c",
        background: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      {message.text}
    </div>
  );
}
