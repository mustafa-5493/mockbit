import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mockbit — Local-First API Simulator & Stateful CRUD Platform",
  manifest: "/manifest.json",
  description:
    "Generate realistic mock endpoints, test conditional rules, simulate stateful CRUD operations, and run local mock servers with npx mockbit.",
  keywords: [
    "mock api",
    "fake json api",
    "mock server",
    "stateful crud simulator",
    "request simulator",
    "openapi exporter",
    "cli mock server",
    "npx mockbit",
    "postman mock alternative",
    "beeceptor alternative",
  ],
  openGraph: {
    title: "Mockbit — Local-First API Simulator & Stateful CRUD Platform",
    description:
      "Generate realistic mock endpoints, test conditional rules, simulate stateful CRUD operations, and run local mock servers with npx mockbit.",
    url: "https://mockbit.io",
    siteName: "Mockbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mockbit — Local-First API Simulator & Stateful CRUD Platform",
    description:
      "Generate realistic mock endpoints, test conditional rules, simulate stateful CRUD operations, and run local mock servers with npx mockbit.",
  },
  metadataBase: new URL("https://mockbit.io"),
  alternates: {
    canonical: "https://mockbit.io",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Mockbit",
  operatingSystem: "All",
  applicationCategory: "DeveloperApplication",
  offers: {
    "@type": "Offer",
    price: "0.00",
    priceCurrency: "USD",
  },
  description:
    "Local-first API simulator, stateful CRUD server, and instant mock API generator.",
  url: "https://mockbit.io",
  author: {
    "@type": "Organization",
    name: "Mockbit",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} dark`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500 selection:text-white min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
