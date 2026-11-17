import {readdirSync, rmSync, mkdirSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
execFileSync(process.execPath, ['scripts/generate.mjs'], {stdio: 'inherit'});
rmSync('dist', {recursive: true, force: true});
mkdirSync('dist');
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--emitDeclarationOnly'], {stdio: 'inherit'});
function entries(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => entry.isDirectory()
    ? entries(`${directory}/${entry.name}`) : /\.tsx?$/.test(entry.name) ? [`${directory}/${entry.name}`] : []);
}
await build({entryPoints: entries('src'), outbase: 'src', outdir: 'dist', format: 'esm', target: 'es2022',
  platform: 'neutral', bundle: false, jsx: 'automatic', legalComments: 'none'});
copyFileSync('manifest.json', 'dist/manifest.json');
