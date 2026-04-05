import { NextRequest, NextResponse } from "next/server";

/**
 * Test API untuk trigger notifikasi
 * Berguna untuk testing email sebelum integrate dengan sistem real
 * 
 * Usage:
 * POST /api/admin/test-notification
 * Body: {
 *   type: "sale" | "error" | "info",
 *   title: "String",
 *   message: "String"
 * }
 * 
 * Contoh:
 * {
 *   "type": "sale",
 *   "title": "New Sale",
 *   "message": "john@example.com upgraded to Pro - 30 Days"
 * }
 */

export async function POST(req: NextRequest) {
  try {
    const { type, title, message } = await req.json();

    if (!type || !title || !message) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          example: {
            type: "sale | error | info",
            title: "Notification Title",
            message: "Notification message",
          },
        },
        { status: 400 }
      );
    }

    // Call the actual notification creation endpoint
    const notificationResponse = await fetch(
      `${process.env.NODE_ENV === 'production' ? process.env.APP_URL : 'http://localhost:3000'}/api/admin/notifications`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, message }),
      }
    );

    const notificationData = await notificationResponse.json();

    if (!notificationResponse.ok) {
      return NextResponse.json(
        { error: "Failed to create notification", details: notificationData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification created and email sent (if preferences enabled)",
      notification: notificationData,
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json(
      { error: "Test failed", details: String(error) },
      { status: 500 }
    );
  }
}
