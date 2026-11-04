import type { Metadata, Viewport } from "next";
import { Inter, Literata } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

// next/font downloads the fonts at build time and serves them from this origin,
// so no request goes to Google at runtime (the CSP stays 'self' and offline works).
// `variable` exposes each font as a CSS variable that tailwind.config.ts uses.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
// Literata (a reading serif) for the answer words, wordmark and word list.
const literata = Literata({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-literata",
});

export const metadata: Metadata = {
  title: "J vagy LY?",
  description: "Gyakorold a magyar helyesírást! Válaszd ki a helyes írásmódot a j és ly közül.",
  applicationName: "J vagy LY?",
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
  colorScheme: "light dark",
  // Browser chrome matches the page ground in each theme.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F2EA" },
    { media: "(prefers-color-scheme: dark)", color: "#11151D" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className={`${inter.variable} ${literata.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
        {children}
        <ServiceWorkerRegister />
        <footer className="mt-auto px-4 pb-8 pt-6 text-center text-[13px] text-ink-muted">
          <p>J vagy LY? © 2026</p>
        </footer>
      </body>
    </html>
  );
}
