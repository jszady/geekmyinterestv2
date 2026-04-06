import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    <html lang="en" className={`${geistSans.variable} dark`}>
      <body className={`${geistSans.className} bg-[#02040d] text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}
