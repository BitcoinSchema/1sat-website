import type { NextConfig } from "next";

export const baseSecurityHeaders = [
	{
		key: "X-Content-Type-Options",
		value: "nosniff",
	},
	{
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin",
	},
	{
		key: "Permissions-Policy",
		value: "camera=(), geolocation=(), microphone=()",
	},
];

export const sensitiveRouteHeaders = [
	{
		key: "Cache-Control",
		value: "private, no-store, max-age=0, must-revalidate",
	},
	{
		key: "Pragma",
		value: "no-cache",
	},
];

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	async headers() {
		return [
			{
				source: "/:path*",
				headers: baseSecurityHeaders,
			},
			{
				source: "/api/cwi/:path*",
				headers: [...sensitiveRouteHeaders, { key: "Vary", value: "Origin" }],
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
			{
				protocol: "https",
				hostname: "api.1sat.app",
				port: "",
				pathname: "/content/**",
			},
		],
	},
};

export default nextConfig;
