import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";
import Providers from "@/components/Providers";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import DemoBanner from "@/components/DemoBanner";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Quality Metrics - Find Undervalued Quality Stocks",
  description: "Data-driven stock analysis using fundamental quality metrics. Discover undervalued quality stocks across global markets with our comprehensive QM scoring system.",
  keywords: ["stock analysis", "quality metrics", "value investing", "stock screener", "fundamental analysis", "undervalued stocks"],
  authors: [{ name: "Quality Metrics" }],
  openGraph: {
    title: "Quality Metrics - Find Undervalued Quality Stocks",
    description: "Data-driven stock analysis using fundamental quality metrics. Discover undervalued quality stocks.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quality Metrics - Find Undervalued Quality Stocks",
    description: "Data-driven stock analysis using fundamental quality metrics.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          <DemoBanner />
          <AnimatedBackground />
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
