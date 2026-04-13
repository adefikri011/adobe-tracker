import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Find the password reset record
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { code },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if email matches
    if (resetRecord.email !== email) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if code has expired
    const now = new Date();
    if (resetRecord.expiresAt < now) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if code was already used
    if (resetRecord.isUsed) {
      return NextResponse.json(
        { error: "This verification code has already been used." },
        { status: 400 }
      );
    }

    // Mark code as used
    await prisma.passwordReset.update({
      where: { code },
      data: { isUsed: true },
    });

    return NextResponse.json(
      { 
        message: "Code verified successfully",
        verified: true,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
