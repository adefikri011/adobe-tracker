import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Using open.er-api.com - completely free, real-time, no API key needed
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store", // Disable cache completely
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch exchange rate" },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Check if API returned success and has IDR rate
    if (data.result === "success" && data.rates && data.rates.IDR) {
      const rate = Math.round(data.rates.IDR * 100) / 100; // Round to 2 decimals
      return NextResponse.json(
        {
          success: true,
          rate: rate,
          timestamp: new Date().toISOString(),
          source: "open.er-api.com (Real-time)",
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    console.error("Invalid API response:", data);
    return NextResponse.json(
      { success: false, error: "Invalid response format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
}
