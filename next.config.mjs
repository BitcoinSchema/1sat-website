/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
	// Turbopack is now default in Next.js 16
	turbopack: {},
	// React Compiler for automatic memoization
	reactCompiler: true,
	// Transpile packages that need to be bundled for server-side use
	transpilePackages: ["isomorphic-dompurify"],
	experimental: {
		viewTransition: true,
	},
	images: {
		dangerouslyAllowSVG: true,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		localPatterns: [
			{
				pathname: "/api/sanitize**",
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
				hostname: "takeit-art-prod.s3.amazonaws.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "takeit-art-stage.s3.amazonaws.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "*.blob.core.windows.net",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
