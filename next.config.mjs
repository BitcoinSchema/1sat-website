/** @type {import('next').NextConfig} */

import CopyPlugin from "copy-webpack-plugin";
import ReplaceModuleWebpackPlugin from "replace-module-webpack-plugin";
const nextConfig = {
	reactStrictMode: true,
	images: {
		dangerouslyAllowSVG: true,
		contentSecurityPolicy:
			"default-src 'self'; script-src 'none'; sandbox;",
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
				hostname: "*.blob.core.windows.net",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "ordinals.gorillapool.io",
				port: "",
				pathname: "/**",
			},
		],
	},
	webpack: (config, { isServer }) => {
		if (isServer) {
			// get the current working directory
			const currentDirectory = process.cwd();

			config.plugins.push(
				new CopyPlugin({
					patterns: [
						{
							from: "node_modules/bsv-wasm/bsv_wasm_bg.wasm",
							to: `${currentDirectory}/.next/server/vendor-chunks/bsv_wasm_bg.wasm`,
						},
						{
							from: "node_modules/bsv-wasm/bsv_wasm_bg.wasm",
							to: `${currentDirectory}/.next/server/app/bsv_wasm_bg.wasm`,
						},
						{
							// This should not be necessary
							from: "node_modules/bsv-wasm/bsv_wasm_bg.wasm",
							to: `${currentDirectory}/.next/server/chunks/bsv_wasm_bg.wasm`,
						},
						{
							// This should not be necessary
							from: "node_modules/bsv-wasm/bsv_wasm_bg.wasm",
							to: `${currentDirectory}/.next/server/app/inscribe/bsv_wasm_bg.wasm`,
						},
					],
				})
			);
		} else {
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
			config.experiments = {
				asyncWebAssembly: true,
				layers: true,
			};
			// config.module.rules.push({
			// 	test: /\.wasm$/,
			// 	type: 'webassembly/async',
			// });
			config.plugins.push(
				new ReplaceModuleWebpackPlugin({
					rules: [
						{
							originModule: "bsv-wasm",
							replaceModule: "bsv-wasm-web",
						},
					],
				})
			);
		}

		return config;
	},
};

export default nextConfig;
