import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const { type, pageTitle, description } = await request.json();

    if (!type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    // Update favicon metadata
    const favicon = await prisma.favicon.update({
      where: { type },
      data: {
        pageTitle: pageTitle || undefined,
        description: description || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: favicon,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
