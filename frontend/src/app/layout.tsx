import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

// Using modern fonts for a premium look
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "FitAI - Virtual Try-On Studio",
  description: "Experience the future of fashion. Upload a photo, pick a garment, and see how you look instantly using state-of-the-art AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col pt-20">
        {/* We add pt-20 because Navbar is fixed at the top */}
        <Navbar />
        <main className="flex-1 w-full relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
