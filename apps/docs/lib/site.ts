export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bloxwap.github.io';
export const repository = 'https://github.com/bloxwap/icons';
export function assetUrl(path: string) { return `${basePath}${path}`; }
