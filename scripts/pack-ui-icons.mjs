import {mkdirSync, readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
mkdirSync('artifacts',{recursive:true});
const {version} = JSON.parse(readFileSync('packages/icons/package.json', 'utf8'));
execFileSync('pnpm',['--filter','@bloxwap/icons','pack','--out',resolve(`artifacts/bloxwap-icons-${version}.tgz`)],{stdio:'inherit'});
