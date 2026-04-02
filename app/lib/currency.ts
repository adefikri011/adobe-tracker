/**
 * Currency conversion utilities
 * Mengkonversi USD <-> IDR berdasarkan exchange rate
 */

import { prisma } from "./prisma";

// Cached settings untuk reduce DB queries
let cachedSettings: {
  currency: string;
  exchangeRate: number;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCurrencySettings() {
  const now = Date.now();

  // Return cached value jika masih fresh
  if (cachedSettings && now - cachedSettings.timestamp < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      // Create default if not exists
      settings = await prisma.appSettings.create({
        data: {
          id: "singleton",
          currency: "USD",
          exchangeRate: 15800,
        },
      });
    }

    cachedSettings = {
      currency: settings.currency,
      exchangeRate: settings.exchangeRate,
      timestamp: now,
    };

    return cachedSettings;
  } catch (error) {
    console.error("Error fetching currency settings:", error);
    // Fallback to defaults
    return {
      currency: "USD",
      exchangeRate: 15800,
      timestamp: now,
    };
  }
}

/**
 * Convert USD to target currency
 * @param usdAmount Amount in USD
 * @param targetCurrency Target currency code ("USD" or "IDR")
 * @returns Converted amount
 */
export async function convertFromUSD(
  usdAmount: number,
  targetCurrency?: string
): Promise<number> {
  const settings = await getCurrencySettings();
  const target = targetCurrency || settings.currency;

  if (target === "USD") {
    return usdAmount;
  }

  if (target === "IDR") {
    return usdAmount * settings.exchangeRate;
  }

  return usdAmount;
}

/**
 * Convert from any currency to USD
 */
export async function convertToUSD(
  amount: number,
  fromCurrency?: string
): Promise<number> {
  const settings = await getCurrencySettings();
  const from = fromCurrency || settings.currency;

  if (from === "USD") {
    return amount;
  }

  if (from === "IDR") {
    return amount / settings.exchangeRate;
  }

  return amount;
}
