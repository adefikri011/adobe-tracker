import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { snap } from "../../../../lib/supabase/midtrans"; 

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

    // 3. Buat Order ID unik (Format: TRX-Timestamp-UserId)
    const orderId = `TRX-${Date.now()}-${user.id.substring(0, 5)}`;

    // 4. Siapkan Parameter untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: plan.finalPrice,
      },
      item_details: [
        {
          id: plan.id,
          price: plan.finalPrice,
          quantity: 1,
          name: plan.name,
        },
      ],
      customer_details: {
        email: user.email,
        // profileId kita simpan di metadata agar mudah dibaca saat webhook
      },
      // Opsional: Custom Field untuk menyimpan data tambahan
      custom_field1: user.id, // Menyimpan ID User
      custom_field2: plan.id, // Menyimpan ID Plan
    };

    // 5. Minta Snap Token dari Midtrans
    const transaction = await snap.createTransaction(parameter);

    // 6. Simpan Transaksi ke Database kamu dengan status 'pending'
    const newTransaction = await prisma.transaction.create({
      data: {
        orderId: orderId,
        profileId: user.id,
        planId: plan.id,
        amount: plan.finalPrice,
        status: "pending",
        snapToken: transaction.token, // Simpan token di sini
      },
    });

    // 7. Kembalikan Token ke Frontend
    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      transactionId: newTransaction.id
    });

  } catch (error: any) {
    console.error("[Checkout POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}