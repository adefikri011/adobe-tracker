import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sectionType = formData.get("sectionType") as string;

    if (!file || !sectionType) {
      return NextResponse.json(
        { error: "File and sectionType are required" },
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

    // Upload to Supabase Storage
    const fileName = `${sectionType}-${Date.now()}-${file.name}`;
    const bytes = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("logos")
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data } = supabase.storage
      .from("logos")
      .getPublicUrl(fileName);

    const fileUrl = data.publicUrl;
    console.log(`✅ Upload successful for ${sectionType}: ${fileUrl}`);

    // Save to database
    const logo = await prisma.logo.upsert({
      where: { sectionType },
      update: {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        updatedAt: new Date(),
      },
      create: {
        sectionType,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: logo,
        fileUrl,
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

export async function GET(request: NextRequest) {
  try {
    const logos = await prisma.logo.findMany();
    return NextResponse.json({ data: logos }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sectionType } = await request.json();

    if (!sectionType) {
      return NextResponse.json(
        { error: "sectionType is required" },
        { status: 400 }
      );
    }

    // Get logo info
    const logo = await prisma.logo.findUnique({
      where: { sectionType },
    });

    if (!logo) {
      return NextResponse.json(
        { error: "Logo not found" },
        { status: 404 }
      );
    }

    // Delete from storage
    const fileName = logo.fileUrl.split("/").pop();
    if (fileName) {
      await supabase.storage
        .from("logos")
        .remove([fileName]);
    }

    // Delete from database
    await prisma.logo.delete({
      where: { sectionType },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
