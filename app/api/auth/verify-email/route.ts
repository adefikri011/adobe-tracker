import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Find and validate the verification code
    const verification = await prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification code not found or already used" },
        { status: 404 }
      );
    }

    // Check if code is already used
    if (verification.isUsed) {
      return NextResponse.json(
        { error: "This verification code has already been used" },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (new Date() > verification.expiresAt) {
      await prisma.emailVerification.delete({
        where: { email },
      });
      return NextResponse.json(
        { error: "Verification code has expired" },
        { status: 400 }
      );
    }

    // Check if code matches
    if (verification.code !== code.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Mark verification as used
    await prisma.emailVerification.update({
      where: { email },
      data: { isUsed: true },
    });

    // Get Supabase client untuk finding user dan confirm email
    const supabase = await createServerSupabaseClient();
    
    // Find user by email di Supabase
    let userId: string | null = null;
    try {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && users) {
        const foundUser = users.find(u => u.email === email);
        if (foundUser) {
          userId = foundUser.id;
          
          // Mark email as confirmed di Supabase
          await supabase.auth.admin.updateUserById(foundUser.id, {
            email_confirm: true,
          });
          
          console.log("[VERIFY-EMAIL] Email confirmed di Supabase untuk:", email);
        }
      }
    } catch (err) {
      console.error("[VERIFY-EMAIL] Error confirming email di Supabase:", err);
    }

    // Update or create profile dengan email confirmed
    if (email) {
      await prisma.profile.upsert({
        where: { email },
        update: {
          status: "active",
        },
        create: {
          id: userId || email.split("@")[0],
          email,
          status: "active",
          plan: "free",
          role: "user",
          fullName: email.split("@")[0],
        },
      });
    }

    return NextResponse.json(
      { 
        message: "Email verified successfully",
        redirect: "/login?message=Email verified successfully. Please login."
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[VERIFY-EMAIL] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
