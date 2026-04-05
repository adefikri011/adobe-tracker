import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET preferences
export async function GET(req: NextRequest) {
  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { id: "singleton" },
    });

    // If doesn't exist, create default
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          id: "singleton",
          emailNotif: true,
          saleNotif: true,
          errorNotif: true,
          adminEmail: "admin@example.com",
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// PUT update preferences
export async function PUT(req: NextRequest) {
  try {
    const { emailNotif, saleNotif, errorNotif, adminEmail } = await req.json();

    const preferences = await prisma.notificationPreference.upsert({
      where: { id: "singleton" },
      update: {
        ...(emailNotif !== undefined && { emailNotif }),
        ...(saleNotif !== undefined && { saleNotif }),
        ...(errorNotif !== undefined && { errorNotif }),
        ...(adminEmail && { adminEmail }),
      },
      create: {
        id: "singleton",
        emailNotif: emailNotif ?? true,
        saleNotif: saleNotif ?? true,
        errorNotif: errorNotif ?? true,
        adminEmail: adminEmail ?? "admin@example.com",
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
