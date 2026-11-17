import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const routes = ['', 'docs', 'docs/getting-started', 'docs/react', 'docs/react-native', 'docs/accessibility', 'docs/assets', 'docs/contributing'];
for (const route of routes) assert(existsSync(join(root, route, 'index.html')), `Missing route: /${route}`);
for (const file of ['search.json', 'sitemap.xml', '404.html', 'generated/LICENSE', 'generated/NOTICE']) assert(existsSync(join(root, file)), `Missing ${file}`);
const manifest = JSON.parse(readFileSync('../../packages/icons/manifest.json', 'utf8'));
for (const { name } of manifest.icons) assert(existsSync(join(root, `generated/svg/${name}.svg`)), `Missing SVG: ${name}`);
let checked = 0;
function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const file = join(directory, entry);
    if (statSync(file).isDirectory()) walk(file);
    else if (file.endsWith('.html')) {
      const html = readFileSync(file, 'utf8');
      for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
        const url = match[1];
        if (url.startsWith('//')) continue;
        assert(!basePath || url === basePath || url.startsWith(`${basePath}/`), `Unprefixed URL in ${file}: ${url}`);
        const target = join(root, decodeURIComponent(url.slice(basePath.length)));
        assert(existsSync(target) || existsSync(`${target}.html`), `Broken local URL in ${file}: ${url}`);
        checked++;
      }
    }
  }
}
walk(root);
assert(readFileSync(join(root, 'index.html'), 'utf8').includes('Find your next icon.'), 'Missing icon landing page');
assert(JSON.parse(readFileSync(join(root, 'search.json'), 'utf8')), 'Invalid static search index');
console.log(`Verified ${routes.length} routes, ${manifest.icons.length} SVGs, search, and ${checked} local URLs at ${basePath || '/'}.`);
