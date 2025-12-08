import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { DualSidebarLayout } from "@/components/dual-sidebar-layout";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletBridge } from "@/components/wallet-bridge";
import { QueryProvider } from "@/providers/query-provider";
import { WalletProvider } from "@/providers/wallet-provider";
import { WalletToolboxProvider } from "@/providers/wallet-toolbox-provider";
import "./globals.css";
import "./animations.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
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
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
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
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

