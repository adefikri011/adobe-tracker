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
      <title>Adobe Tracker - Password Reset</title>
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
          <h1>🔐 Password Reset</h1>
        </div>
        <div class="content">
          <div class="notification-box">
            <div class="notification-title">ℹ️ Verification Code</div>
            <p class="notification-message">
              We received a request to reset your password. Please use the verification code below to confirm your identity:
            </p>
          </div>
          
          <div class="code-box">
            <p class="code">${code}</p>
            <p class="code-note">Verification Code</p>
          </div>

          <p style="font-size: 14px; color: #334155; margin: 16px 0;">
            This code is valid for <strong>15 minutes only</strong>. If you didn't request a password reset, please ignore this email.
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

    // Check if user exists in database with this email
    const user = await prisma.profile.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a password reset code." },
        { status: 200 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Send email with verification code FIRST (before saving to database)
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Adobe Tracker - Password Reset Verification Code",
        html: getEmailTemplate(code),
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // For security and UX, don't reveal email sending failed
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a password reset code." },
        { status: 200 }
      );
    }

    // Only save to database AFTER email is sent successfully
    // Delete any old codes for this email (keep only 1 active)
    await prisma.passwordReset.deleteMany({
      where: { email },
    });

    // Save new code with 15 minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.passwordReset.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    return NextResponse.json(
      { message: "If an account exists with this email, you will receive a password reset code." },
      { status: 200 }
    );

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
