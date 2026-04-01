import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; 

export default async function ProDashboardPage() {
  const { userId } = auth(); // Ambil ID user yang sedang login

  if (!userId) {
    redirect("/sign-in");
  }

  // 1. Ambil data profile dari database
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { plan: true }
  });

  // 2. Jika bukan 'pro', tendang balik ke halaman pilih paket
  if (!profile || profile.plan !== "pro") {
    redirect("/dashboard/billing/plans");
  }

  return (
    <div>
      <h1>Selamat Datang di Fitur Pro! 🚀</h1>
      {/* Isi konten rahasia pro kamu di sini */}
    </div>
  );
}