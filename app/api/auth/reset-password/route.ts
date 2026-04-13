import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, code, and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find the password reset record
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { code },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid reset request" },
        { status: 400 }
      );
    }

    // Check if email matches
    if (resetRecord.email !== email) {
      return NextResponse.json(
        { error: "Invalid reset request" },
        { status: 400 }
      );
    }

    // Check if code was marked as used (verified)
    if (!resetRecord.isUsed) {
      return NextResponse.json(
        { error: "Code has not been verified" },
        { status: 400 }
      );
    }

    // Check if code has expired (even if marked used)
    const now = new Date();
    if (resetRecord.expiresAt < now) {
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Try to update password in Supabase
    const supabase = createServerSupabaseAdminClient();

    try {
      // First, try mencari user by email di Supabase
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      let userId: string | null = null;

      if (listError) {
        console.error("Error listing users:", listError);
        throw listError;
      }

      if (listData?.users) {
        const supabaseUser = listData.users.find(u => u.email === email);
        userId = supabaseUser?.id || null;
      }

      // If not found di Supabase, try mencari dari Profile di Prisma
      // (bisa saja user ID tersimpan di Profile)
      if (!userId) {
        const profile = await prisma.profile.findUnique({
          where: { email },
          select: { id: true },
        });
        userId = profile?.id || null;
      }

      if (!userId) {
        // User tidak ada di Supabase maupun Prisma
        // Kemungkinan user belum selesai registrasi atau verifikasi email
        return NextResponse.json(
          { error: "Your email is not registered. Please register first." },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Failed to update password:", updateError);
        return NextResponse.json(
          { error: "Failed to update password. Please try again." },
          { status: 500 }
        );
      }
    } catch (supabaseError) {
      console.error("Supabase error:", supabaseError);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      );
    }

    // Delete all password reset records for this email
    await prisma.passwordReset.deleteMany({
      where: { email },
    });

    return NextResponse.json(
      { 
        message: "Password reset successfully",
        success: true,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
