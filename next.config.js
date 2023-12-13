const WebpackPluginReplaceNpm = require("replace-module-webpack-plugin");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    fallbackNodePolyfills: false,
  },
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
      config.resolve.fallback = {
        dns: false,
        fs: false,
        module: false,
        crypto: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        net: false,
      };
    }

    config.plugins = [
      ...config.plugins,
      new WebpackPluginReplaceNpm({
        rules: [
          {
            originModule: "path",
            replaceModule: "path-browserify",
          },
          {
            originModule: "bsv-wasm",
            replaceModule: "bsv-wasm-web",
          },
        ],
      }),
    ];

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
