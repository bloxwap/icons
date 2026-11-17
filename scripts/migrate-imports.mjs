import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import ts from 'typescript';
const root=resolve(process.argv[2]);
const report=JSON.parse(readFileSync(new URL('../evidence/icon-inventory.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../packages/icons/manifest.json',import.meta.url)));
const symbols=new Map(manifest.icons.map(icon=>[icon.symbol,icon]));
for(const [alias,name] of Object.entries(manifest.aliases)) symbols.set(alias,symbols.get(name));
let count=0;
for(const entry of report.imports.filter(entry=>entry.root==='monorepo')){
 if(entry.names.includes('icons')||entry.names.includes('createLucideIcon'))continue;
 const path=join(root,entry.file),source=readFileSync(path,'utf8');
 const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true);
 const edits=[];
 for(const node of ast.statements){
  if(!ts.isImportDeclaration(node)||!/^lucide-react(?:-native)?$/.test(node.moduleSpecifier.text))continue;
  const platform=node.moduleSpecifier.text.endsWith('native')?'native':'react';
  const imports=node.importClause.namedBindings.elements.map(element=>{
   const name=(element.propertyName??element.name).text,local=element.name.text;
   if(name==='LucideIcon')return `import type { IconComponent as ${local} } from '@bloxwap/icons/${platform}';`;
   const icon=symbols.get(name);
   if(!icon)throw new Error(`Unknown icon ${name} in ${path}`);
   return `import { ${icon.symbol}${local===icon.symbol?'':` as ${local}`} } from '@bloxwap/icons/${platform}/${icon.name}';`;
  }).join('\n');
  edits.push([node.getStart(ast),node.end,imports]);
 }
 if(edits.length){let output=source;for(const [start,end,text]of edits.reverse())output=output.slice(0,start)+text+output.slice(end);writeFileSync(path,output);count++;}
}
console.log(`Migrated ${count} consumer modules`);
