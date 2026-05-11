import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://jobswipe-production.up.railway.app";
const TITLE = "JobSwipe — מוצאים עבודה בסוויפ";
const DESCRIPTION =
  "פלטפורמת גיוס מהירה לעבודות בישראל בסגנון swipe. מתאימים בין עובדים למעסיקים בלי קורות חיים מסובכים.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · JobSwipe" },
  description: DESCRIPTION,
  applicationName: "JobSwipe",
  authors: [{ name: "JobSwipe" }],
  keywords: ["חיפוש עבודה", "משרות", "גיוס", "JobSwipe", "swipe jobs", "tinder jobs"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JobSwipe",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  // Open Graph — for WhatsApp / Facebook / LinkedIn link previews
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: "JobSwipe",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "JobSwipe — מוצאים עבודה בסוויפ",
      },
    ],
  },
  // Twitter Card — for X (Twitter) link previews
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/icons/icon-512.png"],
  },
  // Allow crawlers (production app — we want to be indexed)
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  // Default "format detection" off — prevents iOS from auto-linking
  // unrelated text as phone/email links inside our app surfaces.
  formatDetection: { telephone: false, email: false, address: false },
};

// viewport must be exported separately in Next.js 15+
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ec4899",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
