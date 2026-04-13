"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "../_components/Navbar";

type UserProfile = {
	name: string;
	email: string;
	avatar: string | null;
	createdAt: string | null;
	lastSignInAt: string | null;
	accountStatus: string;
	planSlug: string;
	planName: string;
	planExpiresAt: string | null;
};

function getInitials(name: string, email: string): string {
	if (name.trim()) {
		const parts = name.trim().split(" ");
		if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
		return parts[0].slice(0, 2).toUpperCase();
	}
	return email.slice(0, 2).toUpperCase();
}

function formatDate(dateString: string | null): string {
	if (!dateString) return "-";
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat("en-US", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export default function ProfilePage() {
	const supabase = createClient();

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isPro, setIsPro] = useState(false);
	const [planLoading, setPlanLoading] = useState(true);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
	const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

	useEffect(() => {
		const loadUser = async () => {
			try {
				const [authRes, profileRes] = await Promise.all([
					supabase.auth.getUser(),
					fetch("/api/user/profile", { cache: "no-store" }),
				]);

				const user = authRes.data?.user;
				if (!user || !profileRes.ok) {
					window.location.href = "/login";
					return;
				}

				const payload = await profileRes.json();
				const apiData = payload?.data;
				const planSlug = apiData?.plan?.slug || "free";
				const planName = apiData?.plan?.name || "Free";
				const isPremium = Boolean(apiData?.plan?.isPremium);
				const planExpiresAt = apiData?.plan?.expiresAt || null;

				setProfile({
					name: apiData?.fullName || user.user_metadata?.full_name || user.user_metadata?.name || "User",
					email: user.email || "-",
					avatar: user.user_metadata?.avatar_url || null,
					createdAt: apiData?.createdAt || user.created_at || null,
					lastSignInAt: user.last_sign_in_at || null,
					accountStatus: apiData?.accountStatus || "active",
					planSlug,
					planName,
					planExpiresAt,
				});

				setFullName(apiData?.fullName || user.user_metadata?.full_name || user.user_metadata?.name || "");
				setEmail(user.email || "");
				setIsPro(isPremium);
			} finally {
				setLoadingProfile(false);
				setPlanLoading(false);
			}
		};

		loadUser();
	}, [supabase]);

	const initials = useMemo(() => {
		if (!profile) return "US";
		return getInitials(profile.name, profile.email);
	}, [profile]);

	const accountPlanLabel = useMemo(() => {
		if (!profile) return "Free";
		const slug = (profile.planSlug || "free").toLowerCase();
		if (slug === "free") return "Free";

		const durationMatch = slug.match(/(\d+)/) || profile.planName.match(/(\d+)/);
		if (durationMatch?.[1]) {
			const days = parseInt(durationMatch[1]);
			return `Pro ${days} Day${days > 1 ? 's' : ''}`;
		}

		return profile.planName || "Pro";
	}, [profile]);

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!profile) return;

		setProfileMessage(null);

		const trimmedName = fullName.trim();
		const trimmedEmail = email.trim().toLowerCase();

		if (trimmedName.length < 2) {
			setProfileMessage({ type: "error", text: "Name must be at least 2 characters." });
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(trimmedEmail)) {
			setProfileMessage({ type: "error", text: "Email format is invalid." });
			return;
		}

		const isNameChanged = trimmedName !== profile.name;
		const isEmailChanged = trimmedEmail !== profile.email.toLowerCase();

		if (!isNameChanged && !isEmailChanged) {
			setProfileMessage({ type: "success", text: "No profile changes detected." });
			return;
		}

		setSavingProfile(true);

		try {
			if (isNameChanged) {
				const res = await fetch("/api/user/profile", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ fullName: trimmedName }),
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data?.error || "Failed to save name.");
				}
			}

			if (isEmailChanged) {
				const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
				if (error) {
					throw new Error(error.message || "Failed to update email.");
				}
			}

			setProfile((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					name: trimmedName,
					email: trimmedEmail,
				};
			});

			setProfileMessage({
				type: "success",
				text: isEmailChanged
					? "Profile saved. Check your email to confirm the address change."
					: "Profile successfully updated.",
			});
		} catch (error) {
			setProfileMessage({
				type: "error",
				text: error instanceof Error ? error.message : "An error occurred while saving your profile.",
			});
		} finally {
			setSavingProfile(false);
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordMessage(null);

		if (newPassword.length < 8) {
			setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." });
			return;
		}

		if (newPassword !== confirmPassword) {
			setPasswordMessage({ type: "error", text: "Passwords do not match." });
			return;
		}

		setSavingPassword(true);

		try {
			const { error } = await supabase.auth.updateUser({ password: newPassword });
			if (error) {
				throw new Error(error.message || "Failed to change password.");
			}

			setNewPassword("");
			setConfirmPassword("");
			setPasswordMessage({ type: "success", text: "Password successfully updated." });
		} catch (error) {
			setPasswordMessage({
				type: "error",
				text: error instanceof Error ? error.message : "An error occurred while changing your password.",
			});
		} finally {
			setSavingPassword(false);
		}
	};

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

					{loadingProfile ? (
						<div className="animate-pulse space-y-4">
							<div className="h-5 w-44 rounded bg-slate-200" />
							<div className="h-8 w-64 rounded bg-slate-200" />
							<div className="h-4 w-56 rounded bg-slate-200" />
						</div>
					) : (
						<div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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
									My Profile
									</p>
									<h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
										{profile?.name || "User"}
									</h1>
									<p className="text-sm sm:text-base text-slate-500 mt-1">{profile?.email || "-"}</p>
								</div>
							</div>
						</div>
					)}
				</section>

				<section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
					<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<p className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400">Join Date</p>
						<p className="text-sm font-semibold text-slate-800 mt-2">{formatDate(profile?.createdAt || null)}</p>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<p className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400">Last Sign In</p>
						<p className="text-sm font-semibold text-slate-800 mt-2">{formatDate(profile?.lastSignInAt || null)}</p>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<p className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400">Account Security</p>
						<div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
							<span className="h-2 w-2 rounded-full bg-emerald-500" />
							<span className="text-xs font-bold text-emerald-700">Secure</span>
						</div>
					</div>
				</section>

				{/* <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
					<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
						<div>
							<h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Quick Actions</h2>
							<p className="text-sm text-slate-500 mt-1">Kelola preferensi akun dan akses fitur penting lebih cepat.</p>
						</div>
					</div>

					<div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<ActionCard href="/dashboard/settings" title="Pengaturan" subtitle="Bahasa, zona waktu, dan preferensi" />
						<ActionCard href="/dashboard/billing/plans" title="Billing" subtitle="Lihat paket dan pembayaran" />
						<ActionCard href="/dashboard/billing/history" title="Riwayat" subtitle="Cek histori transaksi" />
						<ActionCard href="/dashboard/stats/activity" title="Aktivitas" subtitle="Pantau performa akun" />
					</div>
				</section> */}


				<section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					<form onSubmit={handleSaveProfile} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
						<h3 className="text-lg font-black text-slate-900">Edit Profile</h3>
						<p className="text-sm text-slate-500 mt-1">Update your account name and email.</p>

						<div className="mt-5 space-y-4">
							<div>
								<label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
								<input
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									placeholder="Full name"
									className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
								/>
							</div>

							<div>
								<label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
								/>
								<p className="text-xs text-slate-400 mt-2">If your email changes, the system will send a verification to your new email.</p>
							</div>
						</div>

						{profileMessage && (
							<div
								className="mt-4 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
								style={{
									color: profileMessage.type === "success" ? "#166534" : "#b91c1c",
									background: profileMessage.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
									border: `1px solid ${profileMessage.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.25)"}`,
								}}
							>
								{profileMessage.text}
							</div>
						)}

						<button
							type="submit"
							disabled={savingProfile}
							className="mt-5 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
							style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
						>
							{savingProfile ? "Saving..." : "Save Profile"}
						</button>
					</form>

					<div className="space-y-5">
						<form onSubmit={handleChangePassword} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
							<h3 className="text-lg font-black text-slate-900">Change Password</h3>
							<p className="text-sm text-slate-500 mt-1">Use a combination of letters, numbers, and symbols for better security.</p>

							<div className="mt-5 space-y-4">
								<div>
									<label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
									<input
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="Minimum 8 characters"
										className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
									/>
								</div>

								<div>
									<label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
									<input
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="Repeat new password"
										className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
									/>
								</div>
							</div>

							{passwordMessage && (
								<div
									className="mt-4 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
									style={{
										color: passwordMessage.type === "success" ? "#166534" : "#b91c1c",
										background: passwordMessage.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
										border: `1px solid ${passwordMessage.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.25)"}`,
									}}
								>
									{passwordMessage.text}
								</div>
							)}

							<button
								type="submit"
								disabled={savingPassword}
								className="mt-5 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
								style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
							>
								{savingPassword ? "Saving..." : "Update Password"}
							</button>
						</form>

						<div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
							<h3 className="text-lg font-black text-slate-900">Account Status</h3>
							<p className="text-sm text-slate-500 mt-1">Your current active account status.</p>

							<div className="mt-4 flex items-center gap-2 flex-wrap">
								<span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-sm font-bold border border-orange-200">
									{accountPlanLabel}
								</span>
								<span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold border border-slate-200 uppercase">
									{profile?.accountStatus || "active"}
								</span>
							</div>

							{profile?.planExpiresAt && isPro && (
								<div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
									<p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">Expiration Date</p>
									<p className="text-sm font-semibold text-orange-900 mt-1">{formatDate(profile.planExpiresAt)}</p>
								</div>
							)}

							<div className="mt-5">
								<p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Plan Variants</p>
								<div className="mt-2 flex flex-wrap gap-2">
									<PlanChip label="Free" active={profile?.planSlug === "free"} />
									<PlanChip label="Pro 1 Day" active={accountPlanLabel.toLowerCase().includes("1")} />
									<PlanChip label="Pro 3 Days" active={accountPlanLabel.toLowerCase().includes("3")} />
									<PlanChip label="Pro 7 Days" active={accountPlanLabel.toLowerCase().includes("7")} />
								</div>
							</div>

							<p className="text-xs text-slate-400 mt-4">
								To change your plan, use the Billing menu to sync with your active subscription.
							</p>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}

function ActionCard({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
	return (
		<Link
			href={href}
			className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-orange-300 hover:shadow-md"
		>
			<p className="text-sm font-extrabold text-slate-800 group-hover:text-orange-600 transition-colors">{title}</p>
			<p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
		</Link>
	);
}

function PlanChip({ label, active }: { label: string; active: boolean }) {
	return (
		<span
			className="px-2.5 py-1 rounded-lg text-xs font-bold border"
			style={{
				color: active ? "#c2410c" : "#64748b",
				background: active ? "rgba(249,115,22,0.12)" : "rgba(148,163,184,0.08)",
				borderColor: active ? "rgba(249,115,22,0.35)" : "rgba(148,163,184,0.2)",
			}}
		>
			{label}
		</span>
	);
}
