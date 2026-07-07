import type { Metadata, Viewport } from "next";
import { Quicksand, Caveat } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-sans",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Zen's Workout Forest",
  description: "Grow a tiny forest, one workout at a time 🌱",
  appleWebApp: {
    capable: true,
    // "default" + theme-color = solid cream status bar with dark, readable
    // text in the installed app. ("black-translucent" would let the app draw
    // underneath, but iOS forces white status text — invisible on our sky.)
    statusBarStyle: "default",
    title: "Zen's Forest",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Zen's Workout Forest",
    description: "Grow a tiny forest, one workout at a time 🌱",
    images: [
      {
        url: "/og-image.png",
        width: 2446,
        height: 1602,
        alt: "Zen's Workout Forest",
      },
    ],
    type: "website",
  },
};

export const viewport: Viewport = {
  // Same color in light and dark mode so browser chrome never goes black
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6e8d3" },
    { media: "(prefers-color-scheme: dark)", color: "#f6e8d3" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${quicksand.variable} ${caveat.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
