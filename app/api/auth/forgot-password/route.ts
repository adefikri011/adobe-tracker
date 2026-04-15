import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getEmailTemplate(code: string): string {
  const formattedCode = code.slice(0, 3) + " " + code.slice(3);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:2px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- TOP ACCENT BAR -->
          <tr>
            <td style="height:2px;background:linear-gradient(90deg,#f97316,#ec4899);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 44px;">

              <!-- BRAND -->
              <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f97316;margin-bottom:36px;">MetricStock</div>

              <!-- TITLE -->
              <div style="font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.03em;line-height:1.2;margin-bottom:8px;">Password Reset</div>

              <!-- SUBTITLE -->
              <div style="font-size:13px;color:#94a3b8;line-height:1.7;margin-bottom:36px;">We received a request to reset your password.<br/>Use the code below to confirm your identity.</div>

              <!-- CODE LABEL -->
              <div style="font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">Verification Code</div>

              <!-- CODE -->
              <div style="font-size:38px;font-weight:800;color:#0f172a;letter-spacing:0.18em;font-variant-numeric:tabular-nums;margin-bottom:4px;">${formattedCode}</div>

              <!-- DIVIDER -->
              <div style="height:1px;background:#f1f5f9;margin:28px 0;"></div>

              <!-- NOTE -->
              <div style="font-size:12px;color:#94a3b8;line-height:1.75;">
                This code expires in <span style="color:#64748b;font-weight:600;">15 minutes</span>. If you didn't request a password reset, you can safely ignore this email — no action is needed.
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:16px 44px;background:#fafafa;border-top:1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size:11px;color:#94a3b8;">© 2025 MetricStock</td>
                  <td style="text-align:right;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#cbd5e1;">Automated · Do not reply</td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
