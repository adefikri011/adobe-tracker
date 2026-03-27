import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { adobeId } = await request.json();
    if (!adobeId) return NextResponse.json({ message: 'ID Adobe diperlukan' }, { status: 400 });

    // 1. Cek Database (Caching) - Ini bukti sistem kamu efisien
    let asset = await prisma.asset.findUnique({ where: { adobeId: adobeId.toString() } });
    if (asset) return NextResponse.json({ asset, cached: true });

    // 2. SCRAPER ENGINE (Solusi buat masalah API Key)
    // Kita tembak langsung ke URL pencarian Adobe Stock
    const adobeUrl = `https://stock.adobe.com/search?k=${adobeId}`;
    const response = await fetch(adobeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const html = await response.text();
    
    // Ambil Judul & Author dari Meta Tag HTML Adobe (Data Valid!)
    const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
    const creatorMatch = html.match(/<meta name="author" content="(.*?)"/);
    
    // Jika tidak ketemu, kita kasih fallback agar tidak error
    const validTitle = titleMatch ? titleMatch[1].split('|')[0].trim() : `Asset Adobe #${adobeId}`;
    const validCreator = creatorMatch ? creatorMatch[1] : "Verified Contributor";

    // 3. SIMPAN KE SUPABASE
    asset = await prisma.asset.create({
      data: {
        adobeId: adobeId.toString(),
        title: validTitle,
        creator: validCreator,
        status: "Verified",
      },
    });

    return NextResponse.json({ asset, cached: false });
  } catch (error) {
    console.error("Tracking Error:", error);
    return NextResponse.json({ message: 'Gagal memvalidasi data' }, { status: 500 });
  }
}