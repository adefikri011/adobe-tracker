import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getGatewayConfig, getEnvFallback } from "@/lib/gateway-config";
import { prisma } from "@/lib/prisma";
import FaviconUpdater from "./components/FaviconUpdater";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Cache metadata for 1 hour to reduce database load
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const fallbackMetadata: Metadata = {
    title: "Adobe Stock Tracker",
    description: "Track and analyze your Adobe Stock performance",
  };

  try {
    // Use Promise.race with timeout to prevent hanging
    const favicon = await Promise.race([
      prisma.favicon.findUnique({
        where: { type: "admin" },
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      ),
    ]);

    if (favicon) {
      return {
        title: favicon?.pageTitle || "Adobe Stock Tracker",
        description: favicon?.description || "Track and analyze your Adobe Stock performance",
        icons: {
          icon: favicon?.fileUrl || "/favicon.ico",
        },
      };
    }

    return fallbackMetadata;
  } catch (error) {
    console.error("Error generating metadata:", error);
    return fallbackMetadata;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get Midtrans config from DB, fallback to env
  const midtransConfig = await getGatewayConfig("midtrans") || getEnvFallback("midtrans");
  const midtransClientKey = midtransConfig?.clientKey || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Midtrans Snap SDK - untuk payment gateway */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={midtransClientKey}
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col font-inter">
        <FaviconUpdater />
        {children}
      </body>
    </html>
  );
}
