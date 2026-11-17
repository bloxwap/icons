import {readFileSync, readdirSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, relative, basename} from 'node:path';
import {createRequire} from 'node:module';

// Parse imports, rather than matching generated documentation or strings that
// happen to contain an import. Run against source checkouts, never node_modules.
const require = createRequire(import.meta.url);
const ts = require(process.env.ICONS_TYPESCRIPT || 'typescript');
const excluded = new Set(['node_modules', 'dist', 'vendor', '.git', '.next', '.turbo', 'ios', 'android', 'generated']);
function* files(directory) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (excluded.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(?:[cm]?[jt]sx?|mdx?)$/.test(entry.name) && !entry.name.includes('.generated.')) yield path;
  }
}
const roots = process.argv.slice(2).map(path => resolve(path));
if (!roots.length) throw new Error('Usage: node scripts/inventory.mjs <monorepo> <hig>');
const imports = [];
const contentIcons = new Set();
for (const root of roots) {
  for (const path of files(root)) {
    const source = readFileSync(path, 'utf8');
    if (/\.mdx?$/.test(path)) {
      const name = source.match(/^icon:\s*['"]?([A-Z][A-Za-z0-9]*)/m)?.[1];
      if (name) contentIcons.add(name);
      continue;
    }
    if (!source.includes('lucide')) continue;
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) || !statement.moduleSpecifier) continue;
      const module = statement.moduleSpecifier.text;
      if (!/^lucide/.test(module)) continue;
      const bindings = statement.importClause?.namedBindings ?? statement.exportClause;
      const names = bindings?.elements?.map(e => (e.propertyName ?? e.name).text) ?? ['*'];
      imports.push({root: basename(root).replace(/^icons-/, ''), file: relative(root, path), module, names});
    }
  }
}
const symbols = [...new Set(imports.flatMap(entry => entry.names))].sort();
const report = {roots: roots.map(root => basename(root).replace(/^icons-/, '')), symbols, contentIcons: [...contentIcons].sort(), imports};
mkdirSync('evidence', {recursive: true});
writeFileSync('evidence/icon-inventory.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({imports: imports.length, symbols, contentIcons: report.contentIcons}, null, 2));
