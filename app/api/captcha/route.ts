import { cookies } from "next/headers";

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCaptchaText(length = 6) {
    let text = "";
    for (let i = 0; i < length; i++) {
        text += CAPTCHA_CHARS[randomInt(0, CAPTCHA_CHARS.length - 1)];
    }
    return text;
}

function escapeXml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function buildCaptchaSvg(text: string) {
    const width = 150;
    const height = 50;
    const chars = text.split("");

    const textNodes = chars
        .map((char, index) => {
            const x = 16 + index * 22;
            const y = randomInt(30, 40);
            const rotate = randomInt(-20, 20);
            const color = `rgb(${randomInt(30, 120)}, ${randomInt(30, 120)}, ${randomInt(30, 120)})`;
            return `<text x="${x}" y="${y}" fill="${color}" font-size="28" font-weight="700" font-family="monospace" transform="rotate(${rotate} ${x} ${y})">${escapeXml(char)}</text>`;
        })
        .join("");

    const noiseLines = Array.from({ length: 5 })
        .map(() => {
            const x1 = randomInt(0, width);
            const y1 = randomInt(0, height);
            const x2 = randomInt(0, width);
            const y2 = randomInt(0, height);
            const color = `rgba(${randomInt(120, 220)}, ${randomInt(120, 220)}, ${randomInt(120, 220)}, 0.7)`;
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" />`;
        })
        .join("");

    const noiseDots = Array.from({ length: 24 })
        .map(() => {
            const cx = randomInt(0, width);
            const cy = randomInt(0, height);
            const radius = randomInt(1, 2);
            const color = `rgba(${randomInt(80, 180)}, ${randomInt(80, 180)}, ${randomInt(80, 180)}, 0.6)`;
            return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" />`;
        })
        .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="captcha image">
    <rect width="100%" height="100%" fill="#f8fafc" rx="8" ry="8" />
    ${noiseLines}
    ${noiseDots}
    ${textNodes}
</svg>`;
}

export async function GET() {
    try {
        const captchaText = generateCaptchaText(6);
        const svgData = buildCaptchaSvg(captchaText);

        const cookieStore = await cookies();
        cookieStore.set("captcha_text", captchaText, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 300,
        });

        return new Response(svgData, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml; charset=utf-8",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error("Captcha generation error:", error);
        return new Response("Failed to generate captcha", {
            status: 500,
            headers: { "Content-Type": "text/plain" },
        });
    }
}