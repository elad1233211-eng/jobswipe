import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JobSwipe — מוצאים עבודה בסוויפ",
    short_name: "JobSwipe",
    description:
      "פלטפורמת גיוס מהירה לעבודות בישראל בסגנון swipe. חיבור בין עובדים למעסיקים בלי קורות חיים.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ec4899",
    categories: ["business", "productivity"],
    lang: "he",
    dir: "rtl",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      // SVG fallback for browsers that prefer it
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
