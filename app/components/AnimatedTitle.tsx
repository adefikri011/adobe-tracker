"use client";

import { useEffect } from "react";

export default function AnimatedTitle() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      const baseTitle = document.title || "MetricStock";
      const scrollTitle = baseTitle + "   —   ";
      let position = 0;

      const interval = setInterval(() => {
        document.title = scrollTitle.substring(position) + scrollTitle.substring(0, position);
        position = (position + 1) % scrollTitle.length;
      }, 80);

      return () => clearInterval(interval);
    }, 500); // tunggu 500ms biar title dari admin sudah ke-load

    return () => clearTimeout(timeout);
  }, []);

  return null;
}