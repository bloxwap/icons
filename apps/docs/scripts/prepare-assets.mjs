import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = new URL('../public/generated/', import.meta.url);
const provenance = JSON.parse(await readFile(path.join(root, 'vendor/bloxwap-hig/provenance.json'), 'utf8'));
for (const [file, expected] of Object.entries(provenance.sha256)) {
  const bytes = await readFile(path.join(root, 'vendor/bloxwap-hig', file));
  if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error(`HIG checksum mismatch: ${file}`);
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'packages/icons/svg'), new URL('svg/', output), { recursive: true });
for (const file of ['LICENSE', 'NOTICE']) await cp(path.join(root, 'packages/icons', file), new URL(file, output));
console.log('Prepared SVG downloads and licenses from the reviewed UI catalog.');
