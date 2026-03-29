import { prisma } from "@/lib/prisma";
import {
  TrendingUp, Activity, Star, ImageIcon,
} from "lucide-react";
import PerformanceChart from "@/components/admin/dashboard/PerformanceChart";
import TopKeywords      from "@/components/admin/dashboard/TopKeywords";
import TopAssets        from "@/components/admin/dashboard/TopAssets";
import RecentActivity   from "@/components/admin/dashboard/RecentActivity";
import ApiStatusCard    from "@/components/admin/dashboard/ApiStatusCard";
import DashboardShell   from "@/components/admin/dashboard/DashboardShell";

export default async function AdminDashboard() {
  // ── logic tidak diubah ──────────────────────────────────────────────
  const totalUsers = await prisma.profile.count();
  const adminCount = await prisma.profile.count({ where: { role: "admin" } });
  const userCount  = totalUsers - adminCount;
  // ────────────────────────────────────────────────────────────────────

  // Hanya primitif — TIDAK ada icon/React component di sini
  const statsData = {
    totalUsers,
    adminCount,
    userCount,
  };

  return (
    <DashboardShell statsData={statsData}>
      {/* ── Chart + API ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-orange-50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Performa Download</h2>
              <p className="text-xs text-slate-400 mt-0.5">Harian / Bulanan</p>
            </div>
            <TrendingUp size={16} className="text-orange-400" />
          </div>
          <PerformanceChart />
        </div>
        <ApiStatusCard />
      </div>

      {/* ── Top Keywords + Top Assets ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Star size={15} className="text-orange-400" />
            <h2 className="text-sm font-bold text-slate-800">Top Keywords</h2>
          </div>
          <TopKeywords />
        </div>
        <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ImageIcon size={15} className="text-blue-400" />
            <h2 className="text-sm font-bold text-slate-800">Top Assets</h2>
          </div>
          <TopAssets />
        </div>
      </div>

      {/* ── Recent Activity ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
        </div>
        <RecentActivity />
      </div>
    </DashboardShell>
  );
}