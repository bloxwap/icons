import {readdirSync, readFileSync, existsSync, rmSync, mkdirSync, mkdtempSync, copyFileSync, renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
execFileSync(process.execPath, ['scripts/generate.mjs'], {stdio: 'inherit'});
function files(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => entry.isDirectory()
    ? files(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
}
const temporary = mkdtempSync(`${tmpdir()}/bloxwap-icons-build-`);
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--emitDeclarationOnly', '--outDir', temporary], {stdio: 'inherit'});
  await build({entryPoints: files('src').filter(path => /\.tsx?$/.test(path)), outbase: 'src', outdir: temporary, format: 'esm', target: 'es2022',
    platform: 'neutral', bundle: false, jsx: 'automatic', legalComments: 'none'});
  copyFileSync('manifest.json', `${temporary}/manifest.json`);
  // Keep live consumers resolvable while building. Unchanged files retain their
  // timestamps, so another docs build does not trigger needless hot reloads.
  const outputs = new Set();
  for (const source of files(temporary)) {
    const target = `dist/${source.slice(temporary.length + 1)}`;
    outputs.add(target);
    if (existsSync(target) && readFileSync(target).equals(readFileSync(source))) continue;
    mkdirSync(dirname(target), {recursive: true});
    const staged = `${target}.next-${process.pid}`;
    try {
      copyFileSync(source, staged);
      renameSync(staged, target);
    } finally { rmSync(staged, {force: true}); }
  }
  for (const target of files('dist')) {
    if (!outputs.has(target) && !/\.next-\d+$/.test(target)) rmSync(target);
  }
} finally { rmSync(temporary, {recursive: true, force: true}); }
