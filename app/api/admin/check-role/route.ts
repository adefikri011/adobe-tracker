import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Jika tidak login
    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // Cek role di database
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    // Return role
    return NextResponse.json({ 
      isAdmin: profile?.role === "admin",
      role: profile?.role 
    });

  } catch (err) {
    console.error("Check Role Error:", err);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}