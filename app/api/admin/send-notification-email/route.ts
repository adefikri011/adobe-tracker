import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getEmailTemplate } from "../../../lib/email-template";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { notificationId, type, title, message, adminEmail } = await req.json();

    if (!notificationId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get email template
    const { subject, html, text } = getEmailTemplate({ type, title, message });

    // Get admin email from preferences or use provided one
    let toEmail = adminEmail;
    if (!toEmail) {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { id: "singleton" },
      });
      toEmail = prefs?.adminEmail || process.env.ADMIN_EMAIL || "";
    }

    if (!toEmail) {
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 400 }
      );
    }

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
      to: toEmail,
      subject,
      html,
      text,
    });

    if (emailResult.error) {
      console.error("Resend error:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send email", details: emailResult.error },
        { status: 500 }
      );
    }

    // Update notification with sent status
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        sent: true,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      messageId: emailResult.data?.id,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: String(error) },
      { status: 500 }
    );
  }
}
