import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Ambil data lengkap: role, plan, dan planExpiry
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { 
      role: true,
      plan: true,
      planExpiry: true 
    },
  });

  // 2. Redirect jika Admin ke Dashboard Admin
  if (profile?.role === "admin") redirect("/admin");

  // 3. LOGIKA PROTEKSI OTOMATIS (Optional tapi Bagus):
  // Jika user punya status 'pro' tapi tanggal expiry-nya sudah lewat, 
  // kita bisa paksa update di sini atau biarkan sistem 'Cron' yang bekerja.
  // Tapi untuk keamanan di UI, kita cek di sini:
  const isExpired = profile?.planExpiry && new Date() > profile.planExpiry;
  
  // Jika expired, anggap dia 'free' untuk tampilan UI (tapi database tetap diupdate oleh Cron nanti)
  const userPlan = isExpired ? "free" : profile?.plan || "free";

  return (
    <div className="min-h-screen">
      {/* Kamu bisa mempassing status 'userPlan' ini ke Navbar atau Sidebar 
         melalui context atau langsung sebagai props jika children-nya butuh 
      */}
      {children}
    </div>
  );
}