import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Verifikasi Signature Key (Sangat Penting agar tidak bisa dipalsukan)
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    
    // Rumus Midtrans: SHA512(order_id + status_code + gross_amount + serverKey)
    const hash = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (hash !== signature_key) {
      return NextResponse.json({ error: "Invalid Signature" }, { status: 403 });
    }

    // 2. Cari Transaksi di Database kita
    const myTransaction = await prisma.transaction.findUnique({
      where: { orderId: order_id },
      include: { plan: true }, // Ambil data durasi harinya
    });

    if (!myTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 3. Update Status Berdasarkan Status dari Midtrans
    let dbStatus: any = "pending";
    
    if (transaction_status === "capture" || transaction_status === "settlement") {
      dbStatus = "success";
    } else if (transaction_status === "deny" || transaction_status === "cancel") {
      dbStatus = "failed";
    } else if (transaction_status === "expire") {
      dbStatus = "expired";
    }

    // 4. Jika Sukses, Update Profile dan Buat Subscription
    if (dbStatus === "success" && myTransaction.status !== "success") {
      const duration = myTransaction.plan.durationDays;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      // Jalankan semua update dalam satu transaksi DB agar aman
      await prisma.$transaction([
        // Update status transaksi kita
        prisma.transaction.update({
          where: { orderId: order_id },
          data: { 
            status: "success", 
            paidAt: new Date(),
            metadata: body // Simpan raw response buat jaga-jaga
          },
        }),
        // Update plan di Profile user
        prisma.profile.update({
          where: { id: myTransaction.profileId },
          data: { plan: myTransaction.plan.slug },
        }),
        // Buat record di Subscription aktif
        prisma.subscription.create({
          data: {
            profileId: myTransaction.profileId,
            planId: myTransaction.planId,
            status: "active",
            startDate: new Date(),
            endDate: endDate,
          },
        }),
      ]);
    } else {
      // Jika status bukan sukses (misal: expired/failed), cukup update status transaksinya saja
      await prisma.transaction.update({
        where: { orderId: order_id },
        data: { status: dbStatus, metadata: body },
      });
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("[Webhook POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}