import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getEnvFallback } from "@/lib/gateway-config";
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

export const metadata: Metadata = {
  title: "Adobe Stock Tracker",
  description: "Track and analyze your Adobe Stock performance",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const midtransConfig = getEnvFallback("midtrans");
  const midtransClientKey = midtransConfig?.clientKey || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
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