/**
 * Utility untuk helper IP extraction
 */

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip");
  return ip ?? "unknown";
}
