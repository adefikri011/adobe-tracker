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
    const type = formData.get("type") as string; // admin, user, land
    const pageTitle = formData.get("pageTitle") as string | null;
    const description = formData.get("description") as string | null;

    if (!file || !type) {
      return NextResponse.json(
        { error: "File and type are required" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["admin", "user", "land"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid favicon type" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage - favicons folder
    const fileName = `favicon-${type}-${Date.now()}-${file.name}`;
    const bytes = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("logos")
      .upload(`favicons/${fileName}`, bytes, {
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
      .getPublicUrl(`favicons/${fileName}`);

    const fileUrl = data.publicUrl;
    console.log(`✅ Favicon upload successful for ${type}: ${fileUrl}`);

    // Save to database
    const favicon = await prisma.favicon.upsert({
      where: { type },
      update: {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        pageTitle: pageTitle || undefined,
        description: description || undefined,
        updatedAt: new Date(),
      },
      create: {
        type,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        pageTitle: pageTitle || undefined,
        description: description || undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: favicon,
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
    const favicons = await prisma.favicon.findMany();
    return NextResponse.json({ data: favicons }, { status: 200 });
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
    const { type } = await request.json();

    if (!type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    // Get favicon info
    const favicon = await prisma.favicon.findUnique({
      where: { type },
    });

    if (!favicon) {
      return NextResponse.json(
        { error: "Favicon not found" },
        { status: 404 }
      );
    }

    // Delete from storage
    const fileName = favicon.fileUrl.split("/").pop();
    if (fileName) {
      await supabase.storage
        .from("logos")
        .remove([`favicons/${fileName}`]);
    }

    // Delete from database
    await prisma.favicon.delete({
      where: { type },
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
