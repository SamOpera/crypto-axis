import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoChannel Africa — Live AI Broadcast",
  description:
    "Real-time AI-powered crypto news broadcast. Cryztatoken of Africa — your 24/7 AI anchor.",
  openGraph: {
    title:       "CryptoChannel Africa",
    description: "AI-powered crypto media network. Live broadcasts, trader sentiment, real-time markets.",
    siteName:    "CryptoChannel Africa",
    locale:      "en_US",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "CryptoChannel Africa",
    description: "AI crypto broadcast network — live 24/7.",
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#07080C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-crypto-bg text-crypto-text font-sora antialiased">
        {children}
      </body>
    </html>
  );
}
