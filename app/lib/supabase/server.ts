import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
              // Set cookies dengan maxAge 30 hari untuk consistency
              cookieStore.set(name, value, {
                ...options,
                maxAge: options?.maxAge || 30 * 24 * 60 * 60, // 30 days default
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax" as const,
              })
            );
          } catch (e) {
            console.error("[Supabase Server] Error setting cookie:", e);
          }
        },
      },
    }
  );
}