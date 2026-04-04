import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";

import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { SwRegister } from "@/components/pwa/sw-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";

import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kioku-learn.vercel.app"),
  title: {
    default: "Kioku — Platform Belajar Kosakata Bahasa Jepang",
    template: "%s | Kioku",
  },
  description:
    "Platform belajar kosakata bahasa Jepang gratis untuk penutur Indonesia. Flashcard cerdas dengan FSRS, quiz interaktif bergaya Duolingo, dan AI tutor — semua dalam satu tempat.",
  keywords: [
    "belajar bahasa jepang",
    "kosakata jepang",
    "JLPT N5",
    "JLPT N4",
    "Minna no Nihongo",
    "flashcard",
    "spaced repetition",
    "FSRS",
    "bahasa jepang untuk pemula",
    "hiragana",
    "katakana",
  ],
  authors: [{ name: "Kioku" }],
  creator: "Kioku",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://kioku-learn.vercel.app",
    siteName: "Kioku",
    title: "Kioku — Platform Belajar Kosakata Bahasa Jepang",
    description:
      "Platform belajar kosakata bahasa Jepang gratis untuk penutur Indonesia. Flashcard cerdas, quiz interaktif, dan AI tutor.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Kioku — Platform Belajar Kosakata Bahasa Jepang",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kioku — Platform Belajar Kosakata Bahasa Jepang",
    description:
      "Platform belajar kosakata bahasa Jepang gratis untuk penutur Indonesia.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kioku",
  },
  other: {
    "mobile-web-app-capable": "yes",
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
      className={`${playfairDisplay.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable} ${notoSansJP.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0A3A3A" />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <ThemeProvider>
          {children}
          <SwRegister />
          <InstallPrompt />
          <Toaster
            position="bottom-center"
            toastOptions={{
              unstyled: true,
              classNames: {
                toast: "w-full max-w-md",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
