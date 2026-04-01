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

/**
 * Format price dengan currency symbol
 */
export async function formatPrice(
  usdAmount: number,
  currency?: string,
  decimals: number = 2
): Promise<string> {
  const settings = await getCurrencySettings();
  const targetCurrency = currency || settings.currency;

  const converted = await convertFromUSD(usdAmount, targetCurrency);

  if (targetCurrency === "IDR") {
    return `Rp ${Math.round(converted).toLocaleString("id-ID")}`;
  }

  return `$${converted.toFixed(decimals)}`;
}

/**
 * Get both prices (USD and target currency)
 */
export async function getPriceInBothCurrencies(usdAmount: number) {
  const settings = await getCurrencySettings();
  const idrAmount = await convertFromUSD(usdAmount, "IDR");

  return {
    usd: usdAmount,
    idr: idrAmount,
    currentCurrency: settings.currency,
    displayPrice:
      settings.currency === "IDR"
        ? `Rp ${Math.round(idrAmount).toLocaleString("id-ID")}`
        : `$${usdAmount.toFixed(2)}`,
  };
}

/**
 * Clear cache (useful for testing or manual updates)
 */
export function clearCurrencyCache() {
  cachedSettings = null;
}
