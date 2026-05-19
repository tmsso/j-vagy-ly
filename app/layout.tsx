import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "J vagy LY?",
  description: "Gyakorold a magyar helyesírást! Válaszd ki a helyes írásmódot a j és ly közül.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen`}>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {children}
        </main>
        <footer className="text-center text-gray-600 text-sm py-4">
          <p>J vagy LY? © 2026</p>
        </footer>
      </body>
    </html>
  );
}