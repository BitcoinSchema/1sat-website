import AppContext from "@/context";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import React from "react";

// export const API_HOST = `http://shruggr.asuscomm.com:8081`;

export const MAPI_HOST = `https://mapi.gorillapool.io`;
export const WOC_HOST = `https://api.whatsonchain.com`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppContext>
      <Script
        async
        strategy="afterInteractive"
        type="module"
        src="https://unpkg.com/@google/model-viewer@^2.1.1/dist/model-viewer.min.js"
      />
      <React.StrictMode>
        <Component {...pageProps} />
      </React.StrictMode>
    </AppContext>
  );
}
