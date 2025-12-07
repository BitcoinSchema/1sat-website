import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DualSidebarLayout } from "@/components/dual-sidebar-layout";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletBridge } from "@/components/wallet-bridge";
import { QueryProvider } from "@/providers/query-provider";
import { WalletProvider } from "@/providers/wallet-provider";
import { WalletToolboxProvider } from "@/providers/wallet-toolbox-provider";
import "./globals.css";
import "./animations.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "1Sat Web",
  description: "1Sat Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <KeyboardShortcuts />
            <WalletProvider>
              <WalletToolboxProvider>
                <WalletBridge>
                  <DualSidebarLayout>{children}</DualSidebarLayout>
                </WalletBridge>
              </WalletToolboxProvider>
            </WalletProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
