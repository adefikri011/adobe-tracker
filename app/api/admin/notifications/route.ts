import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all notifications
export async function GET(req: NextRequest) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST create new notification
export async function POST(req: NextRequest) {
  try {
    const { type, title, message } = await req.json();

    if (!type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        read: false,
        sent: false,
      },
    });

    // Get preferences to check if should send email
    const preferences = await prisma.notificationPreference.findUnique({
      where: { id: "singleton" },
    });

    // Check if email should be sent based on type and preferences
    const shouldSendEmail =
      preferences?.emailNotif &&
      ((type === "sale" && preferences.saleNotif) ||
        (type === "error" && preferences.errorNotif) ||
        type === "info");

    // Auto-send email if conditions are met
    if (shouldSendEmail) {
      try {
        // Call send email API
        const emailResponse = await fetch(
          `${process.env.NODE_ENV === 'production' ? process.env.APP_URL : 'http://localhost:3000'}/api/admin/send-notification-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notificationId: notification.id,
              type,
              title,
              message,
              adminEmail: preferences?.adminEmail,
            }),
          }
        );

        if (!emailResponse.ok) {
          console.warn("Failed to send notification email:", await emailResponse.text());
        }
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't fail the notification creation if email fails
      }
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

// PUT mark as read
export async function PUT(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

// DELETE notification
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
