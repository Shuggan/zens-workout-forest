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
  title: "Zen's Little Forest",
  description: "Grow a tiny forest, one workout at a time 🌱",
  openGraph: {
    title: "Zen's Little Forest",
    description: "Grow a tiny forest, one workout at a time 🌱",
    images: [
      {
        url: "/zenssmallbellycover.png",
        width: 1024,
        height: 768,
        alt: "Zen's Little Forest",
      },
    ],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf6ec",
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
