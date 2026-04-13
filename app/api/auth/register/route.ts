import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getEmailTemplate(code: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Adobe Tracker - Email Verification</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 32px 24px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 32px 24px;
        }
        .notification-box {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .notification-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #3b82f6;
          margin: 0 0 12px 0;
        }
        .notification-message {
          font-size: 14px;
          color: #334155;
          margin: 0 0 16px 0;
          line-height: 1.6;
        }
        .code-box {
          background: #f1f5f9;
          border: 2px solid #cbd5e1;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          margin: 16px 0;
        }
        .code {
          font-size: 32px;
          font-weight: 700;
          color: #667eea;
          letter-spacing: 4px;
          margin: 0;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        .code-note {
          font-size: 12px;
          color: #64748b;
          margin: 8px 0 0 0;
        }
        .expiry-warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          color: #92400e;
          margin: 16px 0;
        }
        .footer {
          background: #f1f5f9;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✉️ Verify Your Email</h1>
        </div>
        <div class="content">
          <div class="notification-box">
            <div class="notification-title">ℹ️ Email Verification Code</div>
            <p class="notification-message">
              Welcome to Adobe Tracker! Please use the verification code below to confirm your email address:
            </p>
          </div>
          
          <div class="code-box">
            <p class="code">${code}</p>
            <p class="code-note">Verification Code</p>
          </div>

          <p style="font-size: 14px; color: #334155; margin: 16px 0;">
            This code is valid for <strong>15 minutes only</strong>. If you didn't create an account, please ignore this email.
          </p>

          <div class="expiry-warning">
            ⏰ This code expires in 15 minutes for security reasons.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">
            © 2024 Adobe Tracker. All rights reserved.
          </p>
          <p style="margin: 8px 0 0 0; color: #94a3b8;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if email already verified (profile exists and status is active)
    const existingProfile = await prisma.profile.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (existingProfile && existingProfile.status === "active") {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 400 }
      );
    }

    // Rate limiting: Check if recent verification code exists (within last 30 seconds)
    const recentVerification = await prisma.emailVerification.findUnique({
      where: { email },
    });

    if (recentVerification && !recentVerification.isUsed) {
      const secondsSinceCreation = Math.floor((Date.now() - recentVerification.createdAt.getTime()) / 1000);
      if (secondsSinceCreation < 30) {
        return NextResponse.json(
          { 
            error: `Please wait ${30 - secondsSinceCreation} seconds before requesting another code.`,
            waitSeconds: 30 - secondsSinceCreation
          },
          { status: 429 }
        );
      }
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Save new code with 15 minute expiry FIRST (for debugging)
    await prisma.emailVerification.deleteMany({
      where: { email },
    });

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // THEN send email
    try {
      const emailResponse = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Adobe Tracker - Email Verification Code",
        html: getEmailTemplate(code),
      });
      
      console.log("[REGISTER] Email sent successfully:", {
        email,
        from: FROM_EMAIL,
        response: emailResponse,
      });
    } catch (emailError: any) {
      console.error("[REGISTER] Resend API Error:", {
        email,
        from: FROM_EMAIL,
        message: emailError?.message,
        status: emailError?.statusCode,
        details: emailError,
      });
      
      // Still return the code even if email failed (so frontend can see if it's just email issue)
      return NextResponse.json(
        { 
          message: "Verification code generated (email may have failed)",
          error: emailError?.message || "Failed to send verification email. Please try again later.",
          debug: process.env.NODE_ENV === "development" ? {
            message: emailError?.message,
            statusCode: emailError?.statusCode,
          } : undefined,
        },
        { status: 200 } // 200 so database record persists
      );
    }

    return NextResponse.json(
      { message: "Verification code sent to your email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[REGISTER] Error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
