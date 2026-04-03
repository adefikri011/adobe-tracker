import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch activity logs with optional filtering
export async function GET(request: NextRequest) {
  try {
    // For now, skip auth check - we'll add proper auth later
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filter condition
    const where: any = {};
    if (search) {
      where.OR = [
        { user: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { detail: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch total count
    const total = await prisma.activityLog.count({ where });

    // Fetch paginated logs (newest first)
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("[ACTIVITY_LOG_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

// POST - Create activity log (called from other endpoints)
export async function POST(request: NextRequest) {
  try {
    // For now, skip auth check - we'll add proper auth later
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { action, detail, ipAddress, user, email } = body;

    if (!action || !detail) {
      return NextResponse.json(
        { error: "Missing required fields: action, detail" },
        { status: 400 }
      );
    }

    const log = await prisma.activityLog.create({
      data: {
        user: user || "Unknown",
        email: email || "unknown@email.com",
        action,
        detail,
        ipAddress: ipAddress || "",
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("[ACTIVITY_LOG_POST]", error);
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}
