import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusCash",
  description: "Student personal finance, simplified.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-screen bg-app-bg flex justify-center">
        <div className="relative w-full max-w-[420px] min-h-screen flex flex-col">
          <main className="flex-1 pb-16">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
