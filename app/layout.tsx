import { ConditionalSiteFooter } from "@/components/layout/ConditionalSiteFooter";
import { FooterVisibilityProvider } from "@/components/layout/footer-visibility-context";
import { getPublicSiteUrl } from "@/lib/site-public-url";
import type { Metadata } from "next";
import { geistSans, pressStart2P } from "./fonts";
import "./globals.css";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Geek My Interest",
    template: "%s — Geek My Interest",
  },
  description:
    "Hot takes, deep dives, and reviews across gaming, anime, movies, shows, and tech culture.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    siteName: "Geek My Interest",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@geekmyinterest",
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
      className={`${geistSans.variable} ${pressStart2P.variable} dark`}
    >
      <body
        className={`${geistSans.className} overflow-x-hidden bg-[#02040d] text-zinc-100`}
      >
        <FooterVisibilityProvider>
          {children}
          <ConditionalSiteFooter />
        </FooterVisibilityProvider>
      </body>
    </html>
  );
}
