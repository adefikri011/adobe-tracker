import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recentSearches = await prisma.recentSearch.findMany({
      where: { profileId: user.id },
      select: { id: true, query: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return NextResponse.json({ searches: recentSearches });
  } catch (error) {
    console.error("[RecentSearches GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const trimmedQuery = query.trim();

    // Cek apakah query yang sama sudah ada untuk user ini
    const existing = await prisma.recentSearch.findFirst({
      where: {
        profileId: user.id,
        query: trimmedQuery,
      },
    });

    if (existing) {
      // Update timestamp supaya naik ke atas (tidak duplikat)
      const updated = await prisma.recentSearch.update({
        where: { id: existing.id },
        data: { createdAt: new Date() },
      });
      return NextResponse.json({ search: updated });
    }

    // Kalau belum ada, buat baru
    // Jaga max 6 entry per user — hapus yang paling lama kalau sudah 6
    const count = await prisma.recentSearch.count({
      where: { profileId: user.id },
    });

    if (count >= 6) {
      const oldest = await prisma.recentSearch.findFirst({
        where: { profileId: user.id },
        orderBy: { createdAt: "asc" },
      });
      if (oldest) {
        await prisma.recentSearch.delete({ where: { id: oldest.id } });
      }
    }

    const search = await prisma.recentSearch.create({
      data: {
        profileId: user.id,
        query: trimmedQuery,
      },
    });

    return NextResponse.json({ search });
  } catch (error) {
    console.error("[RecentSearches POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    // Clear semua recent searches milik user
    if (all === "true") {
      await prisma.recentSearch.deleteMany({
        where: { profileId: user.id },
      });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Hapus 1 entry, pastikan milik user ini
    await prisma.recentSearch.deleteMany({
      where: { id, profileId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RecentSearches DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}