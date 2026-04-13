import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const sectionType = request.nextUrl.searchParams.get("sectionType");

    if (!sectionType) {
      return NextResponse.json(
        { error: "sectionType parameter is required" },
        { status: 400 }
      );
    }

    // Validate section type
    const validSections = ["admin", "user", "land"];
    if (!validSections.includes(sectionType)) {
      return NextResponse.json(
        { error: "Invalid section type" },
        { status: 400 }
      );
    }

    const logo = await prisma.logo.findUnique({
      where: { sectionType },
    });

    if (!logo) {
      return NextResponse.json(
        { error: "Logo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: logo.id,
      sectionType: logo.sectionType,
      fileName: logo.fileName,
      fileUrl: logo.fileUrl,
      fileSize: logo.fileSize,
      mimeType: logo.mimeType,
      uploadedAt: logo.uploadedAt,
      updatedAt: logo.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    return NextResponse.json(
      { error: "Failed to fetch logo" },
      { status: 500 }
    );
  }
}
