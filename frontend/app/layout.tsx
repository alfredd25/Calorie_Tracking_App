import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "NutriTrack",
  description: "Clean, minimal calorie tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable}>
      <body className={`${geist.className} min-h-screen bg-background text-foreground pb-24 pt-14`}>
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 pt-8">
          {children}
        </main>
      </body>
    </html>
  );
}
