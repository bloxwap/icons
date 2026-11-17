import {readFileSync, writeFileSync, copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';

// Explicit, one-time upstream import. Normal builds use the reviewed catalog,
// never a network request or whatever Lucide version a consumer installed.
const [upstream, inventory, brands] = process.argv.slice(2).map(path => resolve(path));
if (!upstream || !inventory || !brands) throw new Error('Pass lucide-react directory, inventory.json, and legacy brand source');
const version = JSON.parse(readFileSync(`${upstream}/package.json`)).version;
if (version !== '1.61.0') throw new Error(`Expected the audited 1.61.0 baseline; got ${version}`);
const exported = readFileSync(`${upstream}/dist/esm/lucide-react.mjs`, 'utf8');
const locations = new Map();
for (const match of exported.matchAll(/export \{([^}]+)\} from '\.\/icons\/([^']+)';/g)) {
  for (const item of match[1].split(',')) locations.set(item.trim().replace('default as ', ''), match[2]);
}
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return ts.isNumericLiteral(node) ? Number(node.text) : node.text;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(p => [p.name.text, literal(p.initializer)]));
  throw new Error(`Unsupported catalog literal: ${node.getText()}`);
}
const report = JSON.parse(readFileSync(inventory, 'utf8'));
const names = new Set([...report.symbols, ...report.contentIcons,
  'CircleX', 'CircleAlert', 'CircleCheck', 'SlidersHorizontal', 'ScanLine', 'FlaskConical',
]);
for (const helper of ['LucideIcon', 'icons', 'createLucideIcon']) names.delete(helper);
const icons = new Map();
const aliases = {};
for (const name of [...names].sort()) {
  if (name === 'Figma') continue;
  const file = locations.get(name);
  if (!file) throw new Error(`Missing upstream icon ${name}`);
  const ast = ts.createSourceFile(file, readFileSync(`${upstream}/dist/esm/icons/${file}`, 'utf8'), ts.ScriptTarget.Latest, true);
  const declaration = ast.statements.filter(ts.isVariableStatement).flatMap(s => [...s.declarationList.declarations]).find(d => d.name.text === '__iconData');
  if (!declaration) throw new Error(`Missing geometry in ${file}`);
  const data = literal(declaration.initializer);
  if (data.size !== 24) throw new Error(`Unexpected grid in ${file}`);
  const symbol = data.name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
  if (symbol !== name) aliases[name] = symbol;
  const nodes = data.node.map(([tag, {key, ...attrs}]) => [tag, attrs]);
  // HIG animates this path with normalized stroke-dash offsets.
  if (data.name === 'check') for (const [tag, attrs] of nodes) if (tag === 'path') attrs.pathLength = 1;
  icons.set(data.name, {name: data.name, symbol, source: `lucide-react@${version}`, nodes});
}
const brandAst = ts.createSourceFile(brands, readFileSync(brands, 'utf8'), ts.ScriptTarget.Latest, true);
for (const statement of brandAst.statements.filter(ts.isVariableStatement)) {
  for (const declaration of statement.declarationList.declarations) {
    const call = declaration.initializer;
    if (!call || !ts.isCallExpression(call)) continue;
    const name = literal(call.arguments[0]);
    const nodes = literal(call.arguments[1]).map(([tag, {key, ...attrs}]) => [tag, attrs]);
    icons.set(name, {name, symbol: declaration.name.text, source: 'Lucide 0.x artwork retained by Bloxwap docs', nodes});
  }
}
writeFileSync('catalog.json', JSON.stringify({grid: 24, strokeWidth: 2, aliases,
  icons: [...icons.values()].sort((a, b) => a.name.localeCompare(b.name))}, null, 2) + '\n');
copyFileSync(`${upstream}/LICENSE`, 'LICENSE');
writeFileSync('NOTICE', `Initial UI icon geometry is curated from lucide-react ${version}.\nLucide artwork: ISC license; Feather-derived artwork: MIT license.\nThe full upstream attribution and license texts are included in LICENSE.\nGithub and Figma use the Lucide 0.x artwork already maintained in Bloxwap docs.\nBloxwap packaging, adapters, and build tooling: Copyright (c) 2026 Bloxwap, ISC.\n`);
console.log(`Seeded ${icons.size} canonical icons and ${Object.keys(aliases).length} aliases.`);
