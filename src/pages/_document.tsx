import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href="https://1satordinals.com" />
      <meta property="og:title" content="1Sat Ordinals" />
      <meta name="description" content="1Sat Ordinals Wallet" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://1satordinals.com" />
      <meta
        property="og:image:url"
        content="https://1satordinals.com/1satlogo.png"
      />
      <meta
        property="og:image"
        content="https://1satordinals.com/1satlogo.png"
      />
      <meta property="og:description" content="1Sat Ordinals Wallet" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="preconnect" href="https://api.whatsonchain.com"></link>
      <link rel="preconnect" href="https://fonts.gstatic.com"></link>
      <link rel="preconnect" href="https://webserver.tonicpow.com"></link>
      <link rel="preconnect" href="https://ordfs.network"></link>
      <link rel="preconnect" href="https://v3.ordinals.gorillapool.io"></link>
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content="@1SatOrdinals" />
      <meta
        name="twitter:image"
        content="https://1satordinals.com/1satlogo.png"
      />
      <meta name="theme-color" content="#000" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/1satlogo.png"></link>
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto+Mono&family=Roboto+Slab&family=Ubuntu:wght@300;400;500;700&display=swap"
        rel="stylesheet"
      />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
