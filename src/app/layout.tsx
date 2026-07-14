import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import DevPanel from "@/components/dev/DevPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusCash",
  description: "Student personal finance, simplified.",
};

/**
 * Split-pane shell: the consumer view keeps its phone-shaped 420px frame but
 * becomes a self-scrolling column, so the DevPanel can dock beside it on
 * desktop without the fixed-position bottom nav drifting off the frame.
 * Below lg the panel disappears entirely and the app renders exactly as before.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-dvh overflow-hidden bg-app-bg">
        <div className="flex h-full">
          <div className="flex-1 flex justify-center min-w-0">
            {/* Phone frame: fixed-height positioned box. The scroller inside
                it scrolls; overlays portal into #phone-overlay-root so modals
                cover exactly the phone — never the dev panel. */}
            <div className="relative w-full max-w-[420px] h-full">
              <div className="h-full flex flex-col overflow-y-auto">
                <main className="flex-1">{children}</main>
                <BottomNav />
              </div>
              <div id="phone-overlay-root" />
            </div>
          </div>
          <DevPanel />
        </div>
      </body>
    </html>
  );
}
