import {mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
mkdirSync('artifacts',{recursive:true});
execFileSync('pnpm',['--filter','@bloxwap/icons','pack','--out',resolve('artifacts/bloxwap-icons-0.1.0.tgz')],{stdio:'inherit'});
