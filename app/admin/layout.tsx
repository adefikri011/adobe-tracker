import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SidebarProvider } from "@/components/admin/SidebarContext";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/Sidebar";
import NavigationLoader from "@/components/NavigationLoader";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── auth & role guard — tidak diubah ───────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      fullName: true,
      email: true,
    },
  });

  if (profile?.role !== "admin") redirect("/dashboard");
  // ───────────────────────────────────────────────────────────────────────

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#fafafa] overflow-hidden">
        <AdminSidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader
            profile={{
              fullName: profile?.fullName ?? user.user_metadata?.full_name ?? user.email ?? "Admin",
              email: profile?.email ?? user.email ?? null,
              role: profile?.role ?? "admin",
            }}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
             <NavigationLoader />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}