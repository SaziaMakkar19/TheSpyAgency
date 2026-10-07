import type { Metadata } from "next";
import "./globals.css";
import { Outfit, Inter, Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "The Spy Agency — Viral Social Media Campaigns For Realtors",
  description:
    "A coordinated media network that blankets your local market. AI-generated listing campaigns co-published by your entire office.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} ${spaceGrotesk.variable} ${jakarta.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
