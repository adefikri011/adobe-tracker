import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        status: "not_authenticated",
        user: null
      });
    }

    // Get user profile from database
    const profile = await prisma.profile.findUnique({
      where: { email: user.email || "" },
      select: { id: true, email: true, role: true, fullName: true }
    });

    return NextResponse.json({
      status: "authenticated",
      supabaseUser: {
        id: user.id,
        email: user.email,
        userMetadata: user.user_metadata
      },
      databaseProfile: profile,
      isAdmin: profile?.role === "admin"
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: String(error)
    }, { status: 500 });
  }
}
