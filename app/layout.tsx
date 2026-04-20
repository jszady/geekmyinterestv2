import type { Metadata } from "next";
import { geistSans, pressStart2P } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Geek My Interest",
  description:
    "Gaming, tech, reviews, and geek culture — a modern media platform for the community.",
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
      <body className={`${geistSans.className} bg-[#02040d] text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}
