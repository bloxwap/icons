import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export', trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  images: { unoptimized: true },
  turbopack: { root: new URL('../..', import.meta.url).pathname },
};
export default createMDX()(config);
