"use client";

import { useEffect } from "react";

export default function FaviconUpdater() {
  useEffect(() => {
    const updateBranding = async () => {
      try {
        const res = await fetch("/api/admin/favicon");
        const { data } = await res.json();
        
        const adminFavicon = data.find((f: any) => f.type === "admin");
        if (adminFavicon) {
          // Update favicon
          if (adminFavicon.fileUrl) {
            const existingFavicon = document.querySelector('link[rel="icon"]');
            if (existingFavicon) {
              existingFavicon.remove();
            }
            
            const link = document.createElement("link");
            link.rel = "icon";
            link.href = `${adminFavicon.fileUrl}?v=${Date.now()}`;
            document.head.appendChild(link);
          }

          // Update page title
          if (adminFavicon.pageTitle) {
            document.title = adminFavicon.pageTitle;
          }

          // Update meta description
          if (adminFavicon.description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
              metaDescription = document.createElement("meta");
              metaDescription.setAttribute("name", "description");
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
  }, []);

  return null;
}
