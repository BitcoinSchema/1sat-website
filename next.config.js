/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: false,
    },
  },
  reactStrictMode: true,
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, module: false };
    }
    return config;
  },
};

module.exports = nextConfig;
