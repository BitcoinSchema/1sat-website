/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
};

module.exports = nextConfig;
