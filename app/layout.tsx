import { ConditionalSiteFooter } from "@/components/layout/ConditionalSiteFooter";
import { FooterVisibilityProvider } from "@/components/layout/footer-visibility-context";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TITLE,
  SITE_URL,
  TWITTER_SITE,
  getAbsoluteUrl,
} from "@/lib/seo";
import type { Metadata } from "next";
import { geistSans, pressStart2P } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Geek My Interest",
  },
  description: DEFAULT_DESCRIPTION,
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
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: getAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Geek My Interest",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_SITE,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [getAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
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
