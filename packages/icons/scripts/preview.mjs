import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import * as icons from '../dist/react/index.js';
const manifest=JSON.parse(readFileSync(new URL('../manifest.json',import.meta.url)));
const cells=manifest.icons.map(({name,symbol})=>`<figure>${renderToStaticMarkup(createElement(icons[symbol],{size:28,'aria-label':name}))}<figcaption>${name}</figcaption></figure>`).join('');
const stroke=renderToStaticMarkup(createElement(icons.Check,{size:48,absoluteStrokeWidth:true,id:'absolute',color:'#b000d0'}));
mkdirSync(new URL('../../../artifacts',import.meta.url),{recursive:true});
writeFileSync(new URL('../../../artifacts/gallery.html',import.meta.url),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Bloxwap icon verification</title><style>body{margin:40px;background:#111;color:#00c853;font:14px system-ui}h1{color:white}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:24px}figure{margin:0;display:grid;justify-items:center;gap:12px}figcaption{color:#aaa;font-size:11px}</style><h1>Bloxwap icons · ${manifest.icons.length} shared vectors</h1><p>48px absolute stroke check: ${stroke}</p><main>${cells}</main></html>`);
