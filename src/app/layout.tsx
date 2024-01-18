import Footer from "@/components/Footer/footer";
import Header from "@/components/header";
import type { Metadata } from "next";
import { Inter, Ubuntu, Ubuntu_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const ubuntu = Ubuntu({
  style: "normal",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const ubuntuMono = Ubuntu_Mono({
  style: "normal",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "1Sat Ordinals - Bitcoin SV",
  description:
    "A open token protocol in the spirit of BTC Ordinals with the cost efficiency and performance of Bitcoin SV.",
};

// get pathname

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`flex flex-col h-100vh ${inter.className}`}>
        <Header ubuntu={ubuntu} />
        {/* <Tabs className={`absolute md:relative m-0 md:my-8 bottom-0 left-0 w-full md:w-fit mx-auto ${ubuntuMono.className}`} /> */}
        {children}
        <Footer />
      </body>
    </html>
  );
}
