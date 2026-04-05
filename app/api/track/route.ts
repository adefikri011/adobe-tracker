import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateAndUpdateUserPlan } from '@/lib/access-control/subscription-manager';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check user authentication first
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    const { adobeId, profileId } = await request.json();
    
    if (!adobeId) return NextResponse.json({ message: 'ID Adobe diperlukan' }, { status: 400 });
    if (!profileId) return NextResponse.json({ message: 'Profile ID diperlukan untuk relasi' }, { status: 400 });

    // Validate that profileId matches authenticated user
    if (profileId !== user.id) {
      return NextResponse.json(
        { message: 'Unauthorized - cannot track for other users' },
        { status: 403 }
      );
    }

    // Validate user's subscription status
    try {
      await validateAndUpdateUserPlan(user.id);
    } catch (error) {
      console.error("[Track] Plan validation error:", error);
      // Silent fail — lanjut dengan tracking
    }

    // 1. Cek Database (Caching)
    // Gunakan 'assetId' sesuai dengan yang ada di schema.prisma
    let asset = await prisma.asset.findUnique({ 
      where: { assetId: adobeId.toString() } 
    });
    
    if (asset) return NextResponse.json({ asset, cached: true });

    // 2. SCRAPER ENGINE
    const adobeUrl = `https://stock.adobe.com/search?k=${adobeId}`;
    const response = await fetch(adobeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const html = await response.text();
    
    const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
    const creatorMatch = html.match(/<meta name="author" content="(.*?)"/);
    
    const validTitle = titleMatch ? titleMatch[1].split('|')[0].trim() : `Asset Adobe #${adobeId}`;
    const validCreator = creatorMatch ? creatorMatch[1] : "Verified Contributor";

    // 3. SIMPAN KE DATABASE
    // Sesuaikan field dengan model 'Asset' di schema.prisma kamu
    asset = await prisma.asset.create({
      data: {
        assetId: adobeId.toString(), // Di schema kamu namanya assetId, bukan adobeId
        title: validTitle,
        contributor: validCreator,   // Di schema kamu ada field contributor
        profileId: profileId,        // WAJIB: Karena di schema Asset punya relasi ke Profile
      },
    });

    return NextResponse.json({ asset, cached: false });
  } catch (error) {
    console.error("Tracking Error:", error);
    return NextResponse.json({ 
      message: 'Gagal memvalidasi data',
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}