const MidtransClient = require("midtrans-client");
import { getGatewayConfig, getEnvFallback } from "../gateway-config";

// Initialize with environment variables as fallback
let fallbackConfig = {
  isProduction: process.env.MIDTRANS_MODE === "production",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
};

// Initialize Snap & CoreApi with fallback
export const snap = new MidtransClient.Snap({
  isProduction: fallbackConfig.isProduction,
  serverKey: fallbackConfig.serverKey,
  clientKey: fallbackConfig.clientKey,
});

export const coreApi = new MidtransClient.CoreApi({
  isProduction: fallbackConfig.isProduction,
  serverKey: fallbackConfig.serverKey,
  clientKey: fallbackConfig.clientKey,
});

export const MIDTRANS_CLIENT_KEY = fallbackConfig.clientKey;
export const IS_PRODUCTION = fallbackConfig.isProduction;

// Function to get initialized Midtrans client with DB config
export async function getInitializedMidtrans() {
  try {
    const dbConfig = await getGatewayConfig("midtrans");
    
    if (dbConfig?.enabled) {
      // Use DB config
      const isProduction = dbConfig.mode === "production";
      return {
        snap: new MidtransClient.Snap({
          isProduction,
          serverKey: dbConfig.serverKey,
          clientKey: dbConfig.clientKey,
        }),
        coreApi: new MidtransClient.CoreApi({
          isProduction,
          serverKey: dbConfig.serverKey,
          clientKey: dbConfig.clientKey,
        }),
        clientKey: dbConfig.clientKey,
        isProduction,
      };
    }
  } catch (error) {
    console.warn("[Midtrans] Failed to load DB config, using environment variables");
  }

  // Fallback to environment variables
  return {
    snap,
    coreApi,
    clientKey: MIDTRANS_CLIENT_KEY,
    isProduction: IS_PRODUCTION,
  };
}
