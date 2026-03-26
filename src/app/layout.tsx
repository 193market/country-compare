import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://country-compare.com"),
  title: "CountryCompare - Compare Economies of 200+ Countries",
  description:
    "Compare economic indicators between countries using World Bank data. GDP, population, unemployment, inflation, and 50+ indicators with interactive charts.",
  verification: {
    google: 'AVHLc-6WoB4TTmgD7BSA5X7JUBqkR8JGBmcJeWKcZI4',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6893801113781732"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Analytics />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
