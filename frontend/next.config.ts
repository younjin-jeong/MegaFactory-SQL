import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Use webpack instead of Turbopack for build (DuckDB-WASM requires webpack)
  webpack: (config, { isServer }) => {
    // DuckDB-WASM uses Web Workers and WASM — exclude from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("@duckdb/duckdb-wasm");
    }
    // Handle .wasm files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
