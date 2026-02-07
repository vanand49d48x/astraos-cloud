import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ASTRA OS — The Operating System for Earth Observation Data",
    template: "%s | ASTRA OS",
  },
  description:
    "ASTRA OS unifies satellite imagery from multiple providers into a single, developer-friendly API. One search, one format, one invoice.",
  metadataBase: new URL("https://astraos.cloud"),
  openGraph: {
    title: "ASTRA OS — The Operating System for Earth Observation Data",
    description:
      "Unify satellite imagery from Sentinel, Landsat, and more into a single API. COG output, STAC metadata, and processing primitives.",
    url: "https://astraos.cloud",
    siteName: "ASTRA OS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASTRA OS — The Operating System for Earth Observation Data",
    description:
      "Unify satellite imagery from multiple providers into a single developer-friendly API.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
