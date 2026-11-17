import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import manifest from '../../../packages/icons/manifest.json';
import usage from '../../../packages/icons/usage.json';
export type Collection = 'bloxwap' | 'pro-chart';
export type CatalogIcon = { name: string; symbol: string; body: string; category: string; aliases: string[]; strokeWidth: number; collections: Collection[]; sourceUrl: string };
function category(name: string) {
  if (name.startsWith('pro-')) return 'Chart tools';
  if (/arrow|chevron|external-link|log-out|menu|house/.test(name)) return 'Navigation';
  if (/banknote|bitcoin|chart|coins|landmark|receipt|trending|wallet|scale/.test(name)) return 'Finance';
  if (/lock|shield|key|ban/.test(name)) return 'Security';
  if (/bell|mail|message|megaphone|users|share|volume|audio|vibrate/.test(name)) return 'Communication';
  return 'Interface';
}
export function getIcons(): CatalogIcon[] {
  const catalog = JSON.parse(readFileSync(resolve(process.cwd(), '../../packages/icons/catalog.json'), 'utf8'));
  return usage.icons.map(entry => {
    const icon = manifest.icons.find(icon => icon.name === entry.name);
    if (!icon) throw new Error(`Used icon is missing from the generated manifest: ${entry.name}`);
    const svg = readFileSync(resolve(process.cwd(), `../../packages/icons/svg/${icon.name}.svg`), 'utf8');
    const source = entry.sources[0];
    const revision = usage.repositories[source.repository as keyof typeof usage.repositories].commit;
    return { name: icon.name, symbol: icon.symbol, body: svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), category: category(icon.name), strokeWidth: icon.strokeWidth, collections: entry.collections as Collection[], sourceUrl: `https://github.com/${source.repository}/blob/${revision}/${source.path}`, aliases: [...entry.searchTerms, ...Object.entries(catalog.aliases).filter(([,symbol]) => symbol === icon.symbol).map(([alias]) => alias)] };
  });
}
