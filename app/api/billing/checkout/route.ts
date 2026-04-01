import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { snap } from "../../../../lib/supabase/midtrans";
import { getCurrencySettings } from "../../../../lib/currency";

export async function POST(req: NextRequest) {
  try {
    // 1. Cek Auth User
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { planId } = body;

    if (!planId) return NextResponse.json({ error: "Plan ID wajib" }, { status: 400 });

    // 2. Ambil data Plan dari DB
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan tidak ditemukan atau tidak aktif" }, { status: 404 });
    }

    // 3. Get currency settings
    const currencySettings = await getCurrencySettings();
    
    // Midtrans expects IDR amount (integer)
    // So we always convert to IDR regardless of display currency
    const chargeAmount = Math.round(plan.finalPrice * currencySettings.exchangeRate);

    // 4. Buat Order ID unik (Format: TRX-Timestamp-UserId)
    const orderId = `TRX-${Date.now()}-${user.id.substring(0, 5)}`;

    // Note: Midtrans always expects IDR (integer format)
    // Amount converted from USD base price using current exchange rate
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: chargeAmount,
      },
      item_details: [
        {
          id: plan.id,
          price: chargeAmount,
          quantity: 1,
          name: plan.name,
        },
      ],
      customer_details: {
        first_name: user.email?.split("@")[0] || "Customer",
        last_name: "User",
        email: user.email,
        phone: "628123456789",
      },
      custom_field1: user.id,
      custom_field2: plan.id,
      custom_field3: currencySettings.currency, // Save currency used at time of transaction
    };

    console.log("📤 Sending to Midtrans:", JSON.stringify(parameter, null, 2));
    const transaction = await snap.createTransaction(parameter);
    console.log("📥 Midtrans Response:", JSON.stringify(transaction, null, 2));

    // 5. Simpan Transaksi ke Database dengan currency info
    const newTransaction = await prisma.transaction.create({
      data: {
        orderId: orderId,
        profileId: user.id,
        planId: plan.id,
        amount: plan.finalPrice, // Store original USD amount for consistency
        status: "pending",
        snapToken: transaction.token,
        metadata: {
          // Store the actual IDR charge to Midtrans for reference
          chargeAmount: chargeAmount,
          currency: currencySettings.currency,
          exchangeRate: currencySettings.exchangeRate,
        },
      },
    });

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      transactionId: newTransaction.id,
      currency: currencySettings.currency,
    });

  } catch (error: any) {
    console.error("[Checkout POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}