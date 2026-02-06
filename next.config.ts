import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	async headers() {
		return [
			{
				source: "/wallet/cwi",
				headers: [
					{
						key: "Content-Security-Policy",
						value: "frame-ancestors *",
					},
				],
			},
		];
	},
	images: {
		localPatterns: [
			{
				pathname: "/api/image",
			},
		],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
				port: "",
				pathname: "/tonicpow/image/fetch/**",
			},
			{
				protocol: "https",
				hostname: "ordfs.network",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
