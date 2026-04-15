import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Fungsi untuk membersihkan HTML agar aman
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getAdminEmailTemplate(data: ContactFormData): string {
  const timestamp = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

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
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:4px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- TOP ACCENT BAR -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#f97316,#ec4899);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 48px;">

              <!-- BRAND -->
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f97316;margin-bottom:28px;">MetricStock</div>

              <!-- HEADLINE -->
              <div style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;margin-bottom:4px;">New Contact Submission</div>
              <div style="font-size:13px;color:#94a3b8;margin-bottom:32px;">Received via contact form</div>

              <!-- DIVIDER -->
              <div style="height:1px;background:#f1f5f9;margin-bottom:24px;"></div>

              <!-- FROM -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px;">
                <tr>
                  <td style="font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#94a3b8;width:80px;">From</td>
                  <td style="font-size:14px;font-weight:500;color:#1e293b;text-align:right;">${escapeHtml(data.name)}</td>
                </tr>
              </table>

              <!-- EMAIL -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px;">
                <tr>
                  <td style="font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#94a3b8;width:80px;">Email</td>
                  <td style="font-size:13px;color:#64748b;text-align:right;">${escapeHtml(data.email)}</td>
                </tr>
              </table>

              <!-- SUBJECT -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#94a3b8;width:80px;">Subject</td>
                  <td style="font-size:14px;font-weight:500;color:#1e293b;text-align:right;">${escapeHtml(data.subject)}</td>
                </tr>
              </table>

              <!-- MESSAGE LABEL -->
              <div style="font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">Message</div>

              <!-- MESSAGE TEXT -->
              <div style="font-size:14px;color:#334155;line-height:1.8;padding:20px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;">
                ${escapeHtml(data.message)}
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:16px 48px;background:#fafafa;border-top:1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size:11px;color:#94a3b8;">${timestamp}</td>
                  <td style="text-align:right;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#cbd5e1;">MetricStock.com</td>
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
    const body = await req.json();
    const { name, email, subject, message }: ContactFormData = body;

    // 1. Validasi Input
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Setup Transporter Nodemailer (Hostinger)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // 3. Kirim Email ke Admin (Kamu)
    await transporter.sendMail({
      from: `"MetricStock System" <${process.env.EMAIL_SERVER_USER}>`,
      to: process.env.EMAIL_SERVER_USER, // admin@metricstock.com
      replyTo: email,
      subject: `[Contact Form] ${subject} - from ${name}`,
      html: getAdminEmailTemplate({ name, email, subject, message }),
    });

    // 4. Kirim Konfirmasi ke User (Opsional tapi bagus)
    try {
      await transporter.sendMail({
        from: `"MetricStock Support" <${process.env.EMAIL_SERVER_USER}>`,
        to: email,
        subject: "Thank you for contacting MetricStock",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3>Hi ${name},</h3>
            <p>We've received your message regarding <b>"${subject}"</b>.</p>
            <p>Our team will get back to you within 24 hours. Thank you!</p>
            <br />
            <p>Best Regards,<br/>MetricStock Team</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Gagal kirim email konfirmasi ke user:", err);
      // Tetap lanjut karena email ke admin sudah sukses
    }

    return NextResponse.json({ message: "Message sent successfully!" }, { status: 200 });

  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}