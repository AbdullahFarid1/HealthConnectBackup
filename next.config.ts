import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: resolve("."),
  },
};

export default nextConfig;
