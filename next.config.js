const WebpackPluginReplaceNpm = require("replace-module-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // async rewrites() {
  //   return [
  //     // Rewrite everything to `pages/index`
  //     {
  //       source: "/api/:path*",
  //       destination: `https://ordinals.gorillapool.io/api/:path*`,
  //     },
  //   ];
  // },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { dns: false, fs: false, module: false };
      // config.resolve.alias = { "bsv-wasm-web": "bsv-wasm" };
    }

    config.plugins = [
      ...config.plugins,
      new WebpackPluginReplaceNpm({
        rules: [
          {
            originModule: "bsv-wasm",
            replaceModule: "bsv-wasm-web",
          },
          // {
          //   originModule: "bsv-wasm",
          //   replaceModule: "bsv-wasm-web",
          //   context: /node_modules\/js-1sat-ord/,
          // },
        ],
      }),
    ];

    return config;
  },
};

module.exports = nextConfig;
