import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGatewayConfig, getEnvFallback } from "@/lib/gateway-config";
import { getClientIP } from "@/lib/activity-log";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Webhook received:", body);

    // 1. Verifikasi Signature Key
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;
    
    // Get Midtrans config from DB, fallback to env
    const midtransConfig = await getGatewayConfig("midtrans") || getEnvFallback("midtrans");
    if (!midtransConfig) {
      return NextResponse.json({ error: "Midtrans not configured" }, { status: 500 });
    }
    
    const serverKey = midtransConfig.serverKey;
    
    console.log("🔍 Webhook Data Received:", { order_id, status_code, gross_amount });
    
    const attempts = [
      String(gross_amount), 
      String(parseInt(gross_amount)),
    ];
    
    let validSignature = false;
    let correctFormat = "";
    
    for (const grossAmountStr of attempts) {
      const hash = crypto
        .createHash("sha512")
        .update(`${order_id}${status_code}${grossAmountStr}${serverKey}`)
        .digest("hex");
      
      if (hash === signature_key) {
        validSignature = true;
        correctFormat = grossAmountStr;
        break;
      }
    }

    if (!validSignature) {
      console.error("❌ Signature mismatch!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    
    console.log("✅ Signature verified.");

    // 2. Cek Notifikasi Test dari Midtrans
    if (order_id.startsWith("payment_notif_test")) {
      return NextResponse.json({ message: "OK - Test notification" });
    }

    // 3. Cari transaksi & paket di database
    const transaction = await prisma.transaction.findUnique({
      where: { orderId: order_id },
      include: { plan: true },
    });

    if (!transaction) {
      console.error(`❌ Transaction not found: ${order_id}`);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 4. Logika Update Pembayaran Sukses
    if (transaction_status === "settlement" || transaction_status === "capture") {
      
      // HITUNG MASA AKTIF (Berdasarkan durationDays dari paket)
      const durationDays = transaction.plan.durationDays;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + durationDays);

      await prisma.$transaction([
        // Update Transaksi ke 'success'
        prisma.transaction.update({
          where: { orderId: order_id },
          data: { 
            status: "success",
            paidAt: new Date()
          }, 
        }),
        // Update Profile User ke 'pro' & set planExpiry & deviceLimit
        prisma.profile.update({
          where: { id: transaction.profileId },
          data: { 
            plan: "pro", 
            planExpiry: expiryDate, // Field baru di Profile kamu
            deviceLimit: transaction.plan.deviceLimit || 1, // Update device limit sesuai plan
          },
        }),
        // Buat record di tabel Subscription
        prisma.subscription.create({
          data: {
            profileId: transaction.profileId,
            planId: transaction.planId,
            status: "active",
            startDate: new Date(),
            endDate: expiryDate, // Masa berlaku paket
          }
        }),
        // Log activity
        prisma.activityLog.create({
          data: {
            user: transaction.profileId,
            email: "webhook-system",
            action: "Payment Successful",
            detail: `Transaction ${order_id} completed. User upgraded to ${transaction.plan.name} plan. Amount: ${gross_amount}. Valid until: ${expiryDate.toISOString()}`,
            ipAddress: getClientIP(req),
          },
        }),
      ]);

      console.log(`✅ SUCCESS: User ${transaction.profileId} upgraded to PRO until ${expiryDate}`);
    } 
    
    // 5. Logika Jika Pembayaran Gagal/Expired
    else if (transaction_status === "expire" || transaction_status === "cancel") {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { orderId: order_id },
          data: { status: "failed" },
        }),
        // Log activity
        prisma.activityLog.create({
          data: {
            user: transaction.profileId,
            email: "webhook-system",
            action: "Payment Failed",
            detail: `Transaction ${order_id} failed (${transaction_status}). Amount: ${gross_amount}.`,
            ipAddress: getClientIP(req),
          },
        }),
      ]);
      console.log(`⚠️ FAILED: Transaction ${order_id} marked as failed`);
    }

    return NextResponse.json({ message: "OK" });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}