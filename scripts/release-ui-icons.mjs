import {appendFileSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const number = '(?:0|[1-9]\\d*)';
const identifier = `(?:${number}|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)`;
const versionPattern = new RegExp(`^${number}\\.${number}\\.${number}(?:-${identifier}(?:\\.${identifier})*)?$`);

export function validateRelease(pkg, refType, refName) {
  if (pkg.name !== '@bloxwap/icons' || pkg.private) throw new Error('Only the public @bloxwap/icons package can be released.');
  if (typeof pkg.version !== 'string' || /\s/.test(pkg.version) || !versionPattern.test(pkg.version)) {
    throw new Error('Use a stable or prerelease semantic version without build metadata.');
  }
  if (refType !== 'tag' || refName !== `icons-v${pkg.version}`) {
    throw new Error(`Release from tag icons-v${pkg.version}; it must match packages/icons/package.json.`);
  }
  return {version: pkg.version, dist_tag: pkg.version.includes('-') ? 'next' : 'latest', archive: `./artifacts/bloxwap-icons-${pkg.version}.tgz`};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const pkg = JSON.parse(readFileSync(new URL('../packages/icons/package.json', import.meta.url), 'utf8'));
  const release = validateRelease(pkg, process.env.GITHUB_REF_TYPE, process.env.GITHUB_REF_NAME);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(release).map(([key, value]) => `${key}=${value}\n`).join(''));
  }
  console.log(JSON.stringify(release));
}
