"use client";

import { useEffect } from "react";

type BrandingItem = {
  type?: string;
  fileUrl?: string | null;
  pageTitle?: string | null;
  description?: string | null;
};

export default function FaviconUpdater() {
  useEffect(() => {
    let cancelled = false;

    const updateBranding = async () => {
      try {
        const res = await fetch("/api/admin/favicon");
        if (!res.ok) return;

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;

        const payload = await res.json();
        const data = payload?.data;

        if (cancelled) return;

        const items: BrandingItem[] = Array.isArray(data) ? data : [];
        const adminFavicon = items.find((f) => f.type === "admin");
        if (adminFavicon) {
          // Update favicon
          if (adminFavicon.fileUrl) {
            // Never remove framework-managed favicon nodes; keep updates in a dedicated node.
            let link = document.querySelector(
              'link[data-branding-favicon="true"]'
            ) as HTMLLinkElement | null;

            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              link.setAttribute("data-branding-favicon", "true");
              document.head.appendChild(link);
            }

            link.href = `${adminFavicon.fileUrl}?v=${Date.now()}`;
          }

          // Update page title
          if (adminFavicon.pageTitle) {
            document.title = adminFavicon.pageTitle;
          }

          // Update meta description
          if (adminFavicon.description) {
            let metaDescription = document.querySelector(
              'meta[data-branding-description="true"]'
            ) as HTMLMetaElement | null;
            if (!metaDescription) {
              metaDescription = document.createElement("meta");
              metaDescription.setAttribute("name", "description");
              metaDescription.setAttribute("data-branding-description", "true");
              document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute("content", adminFavicon.description);
          }
        }
      } catch (error) {
        console.error("Failed to update branding:", error);
      }
    };

    updateBranding();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
