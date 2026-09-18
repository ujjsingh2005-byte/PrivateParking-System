import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Parking System",
  description: "Advanced multi-zone parking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-[#080b12] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-purple-600 selection:text-white`}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
