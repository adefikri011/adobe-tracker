/**
 * Geolocation Helper
 * Detects timezone & location info dari IP address
 */

export interface GeoLocation {
  country?: string;
  countryCode?: string;
  timezone?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Detect timezone dari IP address menggunakan free API
 * Fallback ke Asia/Jakarta jika gagal
 */
export async function detectTimezoneFromIP(ipAddress: string): Promise<string> {
  try {
    // Gunakan ip-api.com (free tier, no key required)
    const response = await fetch(`https://ip-api.com/json/${ipAddress}?fields=timezone,status`, {
      next: { revalidate: 3600 }, // Revalidate setiap 1 jam
    });

    if (!response.ok) {
      console.warn(`Failed to detect timezone for IP ${ipAddress}`);
      return "Asia/Jakarta"; // Default fallback
    }

    const data = await response.json();

    if (data.status === "success" && data.timezone) {
      return data.timezone;
    }

    return "Asia/Jakarta";
  } catch (error) {
    console.error("Geolocation error:", error);
    return "Asia/Jakarta"; // Fallback ke default timezone
  }
}

/**
 * Detect timezone dari IP dan return full location info
 */
export async function detectLocationFromIP(ipAddress: string): Promise<GeoLocation> {
  try {
    const response = await fetch(
      `https://ip-api.com/json/${ipAddress}?fields=country,countryCode,timezone,city,lat,lon,status`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return { timezone: "Asia/Jakarta" };
    }

    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.country,
        countryCode: data.countryCode,
        timezone: data.timezone || "Asia/Jakarta",
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
      };
    }

    return { timezone: "Asia/Jakarta" };
  } catch (error) {
    console.error("Geolocation error:", error);
    return { timezone: "Asia/Jakarta" };
  }
}

/**
 * List semua timezone yang tersedia (IANA timezone)
 */
export const AVAILABLE_TIMEZONES = [
  // Asia
  { zone: "Asia/Jakarta", label: "Jakarta", offset: "UTC+7", flag: "🇮🇩" },
  { zone: "Asia/Singapore", label: "Singapore", offset: "UTC+8", flag: "🇸🇬" },
  { zone: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", offset: "UTC+8", flag: "🇲🇾" },
  { zone: "Asia/Bangkok", label: "Bangkok", offset: "UTC+7", flag: "🇹🇭" },
  { zone: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh", offset: "UTC+7", flag: "🇻🇳" },
  { zone: "Asia/Kolkata", label: "Kolkata", offset: "UTC+5:30", flag: "🇮🇳" },
  { zone: "Asia/Tokyo", label: "Tokyo", offset: "UTC+9", flag: "🇯🇵" },
  { zone: "Asia/Shanghai", label: "Shanghai", offset: "UTC+8", flag: "🇨🇳" },
  { zone: "Asia/Hong_Kong", label: "Hong Kong", offset: "UTC+8", flag: "🇭🇰" },
  { zone: "Asia/Seoul", label: "Seoul", offset: "UTC+9", flag: "🇰🇷" },
  { zone: "Asia/Dubai", label: "Dubai", offset: "UTC+4", flag: "🇦🇪" },

  // America
  { zone: "America/New_York", label: "New York", offset: "UTC-5", flag: "🇺🇸" },
  { zone: "America/Chicago", label: "Chicago", offset: "UTC-6", flag: "🇺🇸" },
  { zone: "America/Denver", label: "Denver", offset: "UTC-7", flag: "🇺🇸" },
  { zone: "America/Los_Angeles", label: "Los Angeles", offset: "UTC-8", flag: "🇺🇸" },
  { zone: "America/Anchorage", label: "Anchorage", offset: "UTC-9", flag: "🇺🇸" },
  { zone: "America/Sao_Paulo", label: "São Paulo", offset: "UTC-3", flag: "🇧🇷" },
  { zone: "America/Toronto", label: "Toronto", offset: "UTC-5", flag: "🇨🇦" },
  { zone: "America/Mexico_City", label: "Mexico City", offset: "UTC-6", flag: "🇲🇽" },

  // Europe
  { zone: "Europe/London", label: "London", offset: "UTC+0", flag: "🇬🇧" },
  { zone: "Europe/Paris", label: "Paris", offset: "UTC+1", flag: "🇫🇷" },
  { zone: "Europe/Berlin", label: "Berlin", offset: "UTC+1", flag: "🇩🇪" },
  { zone: "Europe/Madrid", label: "Madrid", offset: "UTC+1", flag: "🇪🇸" },
  { zone: "Europe/Rome", label: "Rome", offset: "UTC+1", flag: "🇮🇹" },
  { zone: "Europe/Amsterdam", label: "Amsterdam", offset: "UTC+1", flag: "🇳🇱" },
  { zone: "Europe/Moscow", label: "Moscow", offset: "UTC+3", flag: "🇷🇺" },
  { zone: "Europe/Istanbul", label: "Istanbul", offset: "UTC+3", flag: "🇹🇷" },

  // Africa
  { zone: "Africa/Cairo", label: "Cairo", offset: "UTC+2", flag: "🇪🇬" },
  { zone: "Africa/Lagos", label: "Lagos", offset: "UTC+1", flag: "🇳🇬" },
  { zone: "Africa/Johannesburg", label: "Johannesburg", offset: "UTC+2", flag: "🇿🇦" },

  // Oceania
  { zone: "Australia/Sydney", label: "Sydney", offset: "UTC+10", flag: "🇦🇺" },
  { zone: "Australia/Melbourne", label: "Melbourne", offset: "UTC+10", flag: "🇦🇺" },
  { zone: "Pacific/Auckland", label: "Auckland", offset: "UTC+12", flag: "🇳🇿" },
];

/**
 * Get timezone info dari zone string
 */
export function getTimezoneInfo(zone: string) {
  return AVAILABLE_TIMEZONES.find((tz) => tz.zone === zone) || { zone: "UTC", label: "UTC", offset: "UTC+0", flag: "🌍" };
}
