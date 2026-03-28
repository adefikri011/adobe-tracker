import { NextResponse } from 'next/server';
// Pastikan path ini benar menuju file server.ts Anda
import { createServerSupabaseClient } from '@/app/lib/supabase/server'; 

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Halaman tujuan setelah sukses login, default ke /dashboard
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Panggil fungsi sesuai nama yang Anda buat di server.ts
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Jika terjadi error atau kode tidak ada, arahkan balik ke login
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}