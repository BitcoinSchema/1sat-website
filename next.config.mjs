// /** @type {import('next').NextConfig} */

// const path = require('path');

// const nextConfig = {
//   reactStrictMode: true,
//   compiler: {
//     styledComponents: true,
//   },
//   experimental: {
//     optimizeCss: true,
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "res.cloudinary.com",
//         port: "",
//         pathname: "/tonicpow/image/fetch/**",
//       },
//       {
//         protocol: "https",
//         hostname: "ordfs.network",
//         port: "",
//         pathname: "/**",
//       },
//       {
//         protocol: "https",
//         hostname: "ordfs.network",
//         port: "",
//         pathname: "/**",
//       },
//       {
//         protocol: "https",
//         hostname: "takeit-art-prod.s3.amazonaws.com",
//         port: "",
//         pathname: "/**",
//       },
//     ],
//   },
//   webpack: (config, { isServer, dev }) => {
//     if (!isServer) {
//       config.resolve.fallback = {
//         dns: false,
//         fs: false,
//         module: false,
//         crypto: false,
//         os: false,
//         stream: false,
//         http: false,
//         https: false,
//         net: false,
//         process: "process/browser",
//       };
//       config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
//     }
//     // Webpack 5 doesn't enable WebAssembly by default
//     config.experiments = { ...config.experiments, asyncWebAssembly: true };

//     if (!dev && isServer) {
//     }

//     // config.plugins.push(new WasmChunksFixPlugin());
//     // Ensure the filename for the .wasm bundle is the same on both the client
//     // and the server (as in any other mode the ID's won't match)
//     // config.optimization.moduleIds = "named";
//     return config;
//   },
// };

// module.exports = nextConfig;

// class WasmChunksFixPlugin {
//   apply(compiler) {
//     compiler.hooks.thisCompilation.tap("WasmChunksFixPlugin", (compilation) => {
//       compilation.hooks.processAssets.tap(
//         { name: "WasmChunksFixPlugin" },
//         (assets) => {
//          for(const [pathname, source] of Object.entries(assets)) {
//           console.log("WasmChunksFixPlugin", pathname);
//             if (!pathname.match(/\.wasm$/)) return;
//             const name = pathname.split("/")[1];
//             const info = compilation.assetsInfo.get(pathname);
//             // const file = Bun.file(pathname);
//             compilation.deleteAsset(pathname);
//             // log to console
//           compilation.hooks.thisCompilation.console.log("really?");
//             const destination = `./.next/server/chunks/bsv_wasm_bg.wasm`;
//             // const res = await Bun.write(destination, file);
//             console.log("Writing to", destination);
//             console.log("WasmChunksFixPlugin", name, info, pathname);
//             compilation.emitAsset(name, source, info);
//           }
//         }
//       );
//     });
//   }
// }

/** @type {import('next').NextConfig} */

import CopyPlugin from "copy-webpack-plugin";
import ReplaceModuleWebpackPlugin from "replace-module-webpack-plugin";
const nextConfig = {
  reactStrictMode: true,
  images: {
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
              to:
                `${currentDirectory}/.next/server/vendor-chunks/bsv_wasm_bg.wasm`,
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
              to: `${currentDirectory}/.next/server/app/outpoint/[outpoint]/[tab]/bsv_wasm_bg.wasm`,
            },
            {
              // This should not be necessary
              from: "node_modules/bsv-wasm/bsv_wasm_bg.wasm",
              to: `${currentDirectory}/.next/server/app/preview/bsv_wasm_bg.wasm`,
            },
            {
              // This should not be necessary
              from: "node_modules/bsv-wasm/bsv_wasm_bg.wasm",
              to: `${currentDirectory}/.next/server/app/inscribe/bsv_wasm_bg.wasm`,
            },
          ],
        }),
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
        syncWebAssembly: true,
        layers: true,
      }
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
