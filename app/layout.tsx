import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "White Card Wallet | Secure Personal Identity Wallet",
  description:
    "Encrypted personal document wallet with selective disclosure, expiring tokens, and tamper-evident audit hash chains.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-black text-white font-sans antialiased selection:bg-white selection:text-black">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-8 sm:pb-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
