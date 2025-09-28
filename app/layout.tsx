import type React from "react";
import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import "@/components/landing-page/styles.css";
import { Suspense } from "react";
import "./globals.css";
import ContextProvider from "@/context/WalletContext";
import { DTFProvider } from "@/context/DTFContext";
import APIMonitor from "@/components/debug/api-monitor";
import { headers } from "next/headers";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "OSMO",
  description: "Stay with us please",
  icons: {
    icon: [{ url: "/mainlogo.png", type: "image/png" }],
    apple: [{ url: "/mainlogo.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersObj = headers();
  const cookies = headersObj.get("cookie");
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.className}`}>
        <Suspense fallback={null}>
          <ContextProvider cookies={cookies}>
            <DTFProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </DTFProvider>
          </ContextProvider>
          <Analytics />
          {/* <APIMonitor /> */}
        </Suspense>
      </body>
    </html>
  );
}
