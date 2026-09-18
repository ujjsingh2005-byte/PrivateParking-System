import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PARKORA — Intelligent Smart Parking & Mobility Platform",
  description: "Next-generation private parking management, live telemetry, and smart bay reservation platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-[#FAF9F6] text-[#17201D] min-h-screen flex flex-col antialiased selection:bg-[#16A34A] selection:text-white`}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}

