import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../public/fonts/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/GeistMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/GeistMono-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

const jetbrainsMono = localFont({
  src: [
    {
      path: "../public/fonts/JetBrainsMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});


export const metadata: Metadata = {
  title: {
    default: "SIRA — Socratic Interactive RPG Academy",
    template: "%s | SIRA Academy",
  },
  description:
    "Platform belajar koding gratis berbasis gamifikasi RPG. Kuasai Web Development, Machine Learning, dan Computer Science melalui petualangan interaktif.",
  keywords: [
    "belajar coding",
    "platform edukasi",
    "gamifikasi",
    "web development",
    "machine learning",
    "computer science",
    "RPG",
    "Indonesia",
  ],
  authors: [{ name: "SIRA Academy" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "SIRA Academy",
    title: "SIRA — Socratic Interactive RPG Academy",
    description:
      "Level Up Your Code, Conquer the Digital Map. Platform belajar koding gratis berbasis RPG.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SIRA Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SIRA Academy",
    description: "Level Up Your Code, Conquer the Digital Map.",
    images: ["/og-image.png"],
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
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-abyss text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}