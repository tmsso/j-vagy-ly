import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

// next/font downloads the font at build time and serves it from this origin,
// so no request goes to Google at runtime (and the CSP can stay 'self').
const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "J vagy LY?",
  description: "Gyakorold a magyar helyesírást! Válaszd ki a helyes írásmódot a j és ly közül.",
  applicationName: "J vagy LY?",
  // Placeholder icons until the design pass (docs/design/BRIEF.md).
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  // iOS home-screen behaviour (iOS reads these meta tags rather than the manifest).
  appleWebApp: { capable: true, title: "J vagy LY?", statusBarStyle: "default" },
};

// Exporting viewport lets Next emit the single <meta name="viewport"> itself.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Light only until the design pass delivers a real dark theme (ROADMAP Phase 3).
  colorScheme: "light",
  themeColor: "#0284c7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen text-gray-900`}>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {children}
        </main>
        <ServiceWorkerRegister />
        <footer className="text-center text-gray-600 text-sm py-4">
          <p>J vagy LY? © 2026</p>
        </footer>
      </body>
    </html>
  );
}
