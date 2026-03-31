// Lazy load Apify client
let apifyClientInstance: any = null;

export async function getApifyClient() {
  if (!apifyClientInstance) {
    const { ApifyClient } = await import("apify-client");
    apifyClientInstance = ApifyClient;
  }
  return apifyClientInstance;
}
