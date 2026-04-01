const MidtransClient = require("midtrans-client");

const isProduction = process.env.MIDTRANS_MODE === "production";

export const snap = new MidtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

export const coreApi = new MidtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

export const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
export const IS_PRODUCTION = isProduction;