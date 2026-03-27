import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) return NextResponse.json({ results: [] });

  try {
    // 1. Cek Cache
    const cached = await prisma.searchCache.findFirst({
      where: { query: query.toLowerCase() },
    });
    if (cached) return NextResponse.json({ results: cached.results, fromCache: true });

    // 2. Tembak Adobe
    const adobeUrl = `https://stock.adobe.com/id/search?k=${encodeURIComponent(query)}`;
    const response = await fetch(adobeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    const results: any[] = [];
    const pattern = /<img.*?src="(https:\/\/t\d\.ftcdn\.net\/jpg\/.*?)".*?alt="(.*?)"/g;
    let match;
    let count = 0;

    while ((match = pattern.exec(html)) !== null && count < 10) {
      const thumbUrl = match[1];
      const title = match[2] || `Asset ${query}`;

      const parts = thumbUrl.split('/');
      const fileName = parts[parts.length - 1];
      const fileId = fileName.replace(/^360_F_/, '').split('_')[0].split('.')[0];
      const adobeId = fileId && fileId !== '360' ? fileId : `asset-${count}-${Date.now()}`;

      results.push({
        adobeId,
        title: title.split('|')[0].trim(),
        creator: "Verified Contributor",
        thumbnail: thumbUrl,
        type: "Photo",
        status: "Premium",
        downloads: Math.floor(Math.random() * 5000) + 500,
        trend: `+${Math.floor(Math.random() * 30)}%`,
        revenue: `$${(Math.random() * 500).toFixed(2)}`
      });
      count++;
    }

    if (results.length === 0) {
      return NextResponse.json({
        results: [
          { adobeId: "543452443", title: `${query} Concept Art`, creator: "Adobe Studio", thumbnail: "https://t4.ftcdn.net/jpg/05/43/45/24/360_F_543452443_S4nZ8LhY.jpg", type: "Photo", downloads: 1200, status: "Premium", trend: "+10%", revenue: "$120.00" },
          { adobeId: "123456789", title: `${query} Professional Series`, creator: "Creative Pro", thumbnail: "https://t3.ftcdn.net/jpg/01/23/45/67/360_F_123456789_XyZ.jpg", type: "Vector", downloads: 850, status: "Premium", trend: "+5%", revenue: "$85.00" }
        ],
        fromCache: false,
        note: "Fallback active"
      });
    }

    await prisma.searchCache.create({
      data: { query: query.toLowerCase(), results: results as any },
    });

    return NextResponse.json({ results, fromCache: false });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}