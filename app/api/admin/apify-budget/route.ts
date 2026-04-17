import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "APIFY_API_TOKEN not set" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.apify.com/v2/me?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Failed to fetch Apify: ${err}` }, { status: 500 });
    }
    const data = await res.json();
    // Ambil usage dan limit/budget
    const usage = data?.data?.usage ?? 0;
    const limit = data?.data?.limits?.monthlyPlatformBudgetUsd ?? 5.0;
    const balance = data?.data?.platform?.usdBalance ?? 0;
    return NextResponse.json({ usage, limit, balance });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
