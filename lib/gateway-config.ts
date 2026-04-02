import { prisma } from "@/lib/prisma";

export async function getGatewayConfig(gateway: "midtrans" | "stripe") {
  try {
    const config = await prisma.gatewayConfig.findUnique({
      where: { gateway },
    });

    if (!config || !config.enabled) {
      return null;
    }

    return config;
  } catch (error) {
    console.error(`[Gateway Config] Error fetching ${gateway} config:`, error);
    return null;
  }
}

// Fallback ke environment variables jika database tidak tersedia (untuk development)
export function getEnvFallback(gateway: "midtrans" | "stripe") {
  if (gateway === "midtrans") {
    return {
      gateway: "midtrans",
      enabled: !!process.env.MIDTRANS_SERVER_KEY,
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
      clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
      mode: process.env.MIDTRANS_MODE || "sandbox",
    };
  }

  if (gateway === "stripe") {
    return {
      gateway: "stripe",
      enabled: !!process.env.STRIPE_SECRET_KEY,
      serverKey: process.env.STRIPE_SECRET_KEY || "",
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      mode: process.env.NODE_ENV === "production" ? "live" : "test",
    };
  }

  return null;
}
