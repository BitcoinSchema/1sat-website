/** @type {import('next').NextConfig} */

const WebpackPluginReplaceNpm = require("replace-module-webpack-plugin");

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    optimizeCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/tonicpow/image/fetch/**',
      },
    ],
  },
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
        process: "process/browser",
      };
    }
    config.plugins = [
      ...config.plugins,
      new WebpackPluginReplaceNpm({
        rules: [
          {
            originModule: "bsv-wasm",
            replaceModule: "bsv-wasm-web",
          }
        ],
      }),
    ];
    return config;
  }
}

module.exports = nextConfig
