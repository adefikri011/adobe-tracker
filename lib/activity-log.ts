/**
 * Utility untuk mencatat activity log ke database
 */

export async function logActivity(
  action: string,
  detail: string,
  ipAddress?: string
) {
  try {
    const response = await fetch("/api/admin/logs/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        detail,
        ipAddress: ipAddress || "",
      }),
    });

    if (!response.ok) {
      console.error("Failed to log activity:", await response.text());
    }
  } catch (error) {
    console.error("Error logging activity:", error);
    // Jangan throw error - logging harus tidak mengganggu flow utama
  }
}

/**
 * Extract IP dari request dengan benar
 */
export function getClientIP(request: Request): string {
  // Try x-forwarded-for first (untuk proxy/load balancer)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  // Try x-real-ip (nginx, cloudflare, dll)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  
  // Fallback ke cf-connecting-ip (Cloudflare)
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }
  
  return "unknown";
}
