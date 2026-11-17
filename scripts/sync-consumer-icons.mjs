import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {optimizeIcon} from '../packages/icons/scripts/geometry.mjs';
import {createRequire} from 'node:module';
const [monorepo, chartDirectory] = process.argv.slice(2);
if (!monorepo || !chartDirectory) throw new Error('Usage: node scripts/sync-consumer-icons.mjs <monorepo> <chart>');
const root = path.resolve(monorepo);
const chart = path.resolve(chartDirectory);
const catalog = JSON.parse(fs.readFileSync('packages/icons/catalog.json', 'utf8'));
const known = new Map(catalog.icons.map(icon => [icon.symbol, icon.name]));
for (const [alias, symbol] of Object.entries(catalog.aliases)) known.set(alias, known.get(symbol));
const uses = new Map();
const excluded = new Set(['node_modules', 'dist', 'build', 'vendor', '.git', '.next', '.turbo', 'ios', 'android', 'generated', '__tests__', '__mocks__', 'test', 'tests', 'scripts']);
function* files(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (excluded.has(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* files(filename);
    else if (/\.(?:[cm]?[jt]sx?|mdx|json)$/.test(filename) && !/(?:\.test\.|\.spec\.|\.generated\.|\.d\.ts$|jest\.)/.test(filename)) yield filename;
  }
}
function add(symbol, file) {
  if (['LucideIcon', 'LucideProps', 'IconNode', 'icons', 'createLucideIcon'].includes(symbol)) return;
  if (!uses.has(symbol)) uses.set(symbol, new Set());
  uses.get(symbol).add(path.relative(root, file));
}
for (const base of ['apps', 'packages']) {
  for (const file of files(path.join(root, base))) {
    if (file.endsWith('.json') && path.basename(file) !== 'meta.json') continue;
    let source = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.mdx')) {
      const symbol = source.match(/^icon:\s*['"]?([A-Z][A-Za-z0-9]*)/m)?.[1];
      if (symbol) add(symbol, file);
      source = source.replace(/```[\s\S]*?```/g, '');
      source = [...source.matchAll(/^import[\s\S]*?from\s*['"][^'"]+['"];?/gm)].map(match => match[0]).join('\n');
    }
    if (file.endsWith('.json')) {
      const data = JSON.parse(source);
      if (typeof data.icon === 'string') add(data.icon, file);
      continue;
    }
    if (!/lucide|@bloxwap\/icons/.test(source)) continue;
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.moduleSpecifier) continue;
      const module = statement.moduleSpecifier.text;
      if (!/^lucide|^@bloxwap\/icons|lucide-brand-icons/.test(module)) continue;
      const clause = statement.importClause;
      if (clause?.isTypeOnly) continue;
      for (const entry of clause?.namedBindings?.elements ?? []) {
        if (!entry.isTypeOnly) add((entry.propertyName ?? entry.name).text, file);
      }
    }
  }
}
// The plain DOM adapter is a reviewed consumer registry, not the full upstream set.
const plain = fs.readFileSync(path.join(root, 'packages/plain-ui/scripts/gen-icons.mjs'), 'utf8').match(/const ICONS = \[([\s\S]*?)\];/)?.[1];
if (!plain) throw new Error('Could not read the plain DOM icon registry; review its format.');
for (const [, slug] of plain.matchAll(/'([^']+)'/g)) {
  const symbol = slug.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
  add(symbol, path.join(root, 'packages/plain-ui/src/icons.generated.ts'));
}

// Resolve only referenced upstream icons; no full Lucide registry is copied.
const requireFromConsumer = createRequire(path.join(root, 'package.json'));
const upstream = path.dirname(requireFromConsumer.resolve('lucide-react/package.json'));
const version = JSON.parse(fs.readFileSync(path.join(upstream, 'package.json'), 'utf8')).version;
if (version !== '1.61.0') throw new Error(`Review the upstream version before importing: ${version}`);
const locations = new Map();
for (const match of fs.readFileSync(path.join(upstream, 'dist/esm/lucide-react.mjs'), 'utf8').matchAll(/export \{([^}]+)\} from '\.\/icons\/([^']+)';/g)) {
  for (const item of match[1].split(',')) locations.set(item.trim().replace('default as ', ''), match[2]);
}
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return ts.isNumericLiteral(node) ? Number(node.text) : node.text;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(p => [p.name.text, literal(p.initializer)]));
  throw new Error(`Unsupported source literal: ${node.getText()}`);
}
const pascal = name => name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
const records = new Map();
function record(icon, collection, source, searchTerm) {
  let entry = records.get(icon.name);
  if (!entry) { entry = { name: icon.name, collections: [], searchTerms: [], sources: [] }; records.set(icon.name, entry); }
  if (!entry.collections.includes(collection)) entry.collections.push(collection);
  if (searchTerm && !entry.searchTerms.includes(searchTerm)) entry.searchTerms.push(searchTerm);
  if (!entry.sources.some(item => item.repository === source.repository && item.path === source.path)) entry.sources.push(source);
}
// Keep existing exported icons compatible; the gallery shows only the usage inventory.
for (const [symbol, files] of [...uses].sort(([a],[b]) => a.localeCompare(b))) {
  let icon = catalog.icons.find(icon => icon.name === known.get(symbol));
  if (!icon) {
    const filename = locations.get(symbol);
    if (!filename) throw new Error(`Unknown referenced icon: ${symbol}`);
    const ast = ts.createSourceFile(filename, fs.readFileSync(path.join(upstream, 'dist/esm/icons', filename), 'utf8'), ts.ScriptTarget.Latest, true);
    const declaration = ast.statements.filter(ts.isVariableStatement).flatMap(s => [...s.declarationList.declarations]).find(d => d.name.text === '__iconData');
    if (!declaration) throw new Error(`Missing upstream geometry: ${symbol}`);
    const data = literal(declaration.initializer);
    if (data.size !== 24) throw new Error(`Unsupported grid: ${symbol}`);
    icon = catalog.icons.find(icon => icon.name === data.name);
    if (!icon) {
      icon = { name: data.name, symbol: pascal(data.name), source: `lucide-react@${version}`, nodes: data.node.map(([tag, {key, ...attrs}]) => [tag, attrs]) };
      catalog.icons.push(icon);
    }
    if (icon.symbol !== symbol) catalog.aliases[symbol] = icon.symbol;
    known.set(symbol, icon.name);
  }
  for (const file of [...files].sort()) record(icon, 'bloxwap', { repository: 'bloxwap/monorepo', path: file, sha256: createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex') }, symbol);
}
const commit = directory => execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
const chartCommit = commit(chart);
const chartIcons = fs.readdirSync(path.join(chart, 'packages/chart/assets/icons')).filter(file => file.endsWith('.svg')).sort();
// Parse SVG into our catalog's reviewed geometry subset, preserving dashed strokes and fills.
const {optimize} = createRequire(new URL('../packages/icons/package.json', import.meta.url))('svgo');
const chartNames = [];
const geometryOwners = new Map(catalog.icons.filter(icon => !icon.name.startsWith('pro-')).map(icon => [`${icon.strokeWidth ?? 2}:${optimizeIcon(icon).body}`, icon.name]));
for (const file of chartIcons) {
  const sourcePath = `packages/chart/assets/icons/${file}`;
  const svg = fs.readFileSync(path.join(chart, sourcePath), 'utf8');
  let nodes, rootAttrs;
  optimize(svg, {plugins: [{ name: 'read-chart-geometry', fn: () => ({root: {exit(root) {
    const element = root.children.find(node => node.name === 'svg');
    rootAttrs = element.attributes;
    nodes = element.children.filter(node => node.type === 'element').map(node => [node.name, node.attributes]);
  }}}) }]});
  if (rootAttrs.viewBox !== '0 0 24 24' || rootAttrs['stroke-width'] !== '1.5') throw new Error(`Unexpected chart grid or stroke: ${file}`);
  const upstreamName = file.replace(/\.svg$/, '');
  const name = `pro-${upstreamName}`;
  const icon = { name, symbol: `Pro${pascal(upstreamName)}`, source: `bloxwap/chart@${chartCommit}:${sourcePath}`, strokeWidth: 1.5, nodes };
  const geometry = optimizeIcon(icon); // Reject unsupported geometry before writing anything.
  const key = `${icon.strokeWidth}:${geometry.body}`;
  const owner = geometryOwners.get(key);
  if (owner) icon.aliasOf = owner;
  else geometryOwners.set(key, name);
  const index = catalog.icons.findIndex(entry => entry.name === name);
  if (index >= 0) catalog.icons[index] = icon; else catalog.icons.push(icon);
  chartNames.push(name);
  record(icon, 'pro-chart', { repository: 'bloxwap/chart', path: sourcePath, sha256: createHash('sha256').update(svg).digest('hex') }, upstreamName);
}
catalog.icons.sort((a,b) => a.name.localeCompare(b.name));
catalog.aliases = Object.fromEntries(Object.entries(catalog.aliases).sort(([a],[b])=>a.localeCompare(b)));
const usage = {
  repositories: { 'bloxwap/monorepo': { commit: commit(root) }, 'bloxwap/chart': { commit: chartCommit } },
  scope: 'Value imports, MDX icon metadata and imports, and the plain DOM adapter from Bloxwap apps/packages; all SVGs shipped by the Pro chart library. Test fixtures and generated documentation are excluded.',
  icons: [...records.values()].sort((a,b)=>a.name.localeCompare(b.name)),
};
fs.writeFileSync('packages/icons/catalog.json', JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync('packages/icons/usage.json', JSON.stringify(usage,null,2)+'\n');
const chartLicense = fs.readFileSync(path.join(chart, 'packages/chart/LICENSE'),'utf8');
const license = fs.readFileSync('packages/icons/LICENSE','utf8');
if (!license.includes('Copyright (c) 2026 chart-ts contributors')) fs.appendFileSync('packages/icons/LICENSE', '\nBloxwap Chart artwork\n=====================\n\n'+chartLicense);
const notice = fs.readFileSync('packages/icons/NOTICE','utf8');
if (!notice.includes('Bloxwap Chart toolbar')) fs.appendFileSync('packages/icons/NOTICE', 'Bloxwap Chart toolbar and drawing-tool SVG artwork: MIT, Copyright (c) 2026 chart-ts contributors. Original 24-unit geometry and 1.5-unit stroke retained; source revisions and checksums are recorded in usage.json.\n');
console.log(JSON.stringify({ galleryIcons: records.size, bloxwap: [...records.values()].filter(x=>x.collections.includes('bloxwap')).length, proChart: chartNames.length, compatibilityOnly: catalog.icons.filter(x=>!records.has(x.name)).map(x=>x.name) }, null, 2));
