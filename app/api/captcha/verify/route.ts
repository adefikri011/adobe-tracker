import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { captchaInput } = await request.json();

  const cookieStore = await cookies();
  const storedCaptcha = cookieStore.get("captcha_text")?.value;

  if (!storedCaptcha || !captchaInput) {
    return NextResponse.json(
      { valid: false, message: "Captcha expired or not found" },
      { status: 400 }
    );
  }

  // Case-insensitive comparison
  const isValid = captchaInput.toLowerCase() === storedCaptcha.toLowerCase();

  if (isValid) {
    // Clear captcha setelah berhasil diverifikasi
    cookieStore.delete("captcha_text");
  }

  return NextResponse.json({ valid: isValid });
}
