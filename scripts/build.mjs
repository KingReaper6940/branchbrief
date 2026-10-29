import {mkdir,copyFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(root,'dist');
if(dirname(out)!==root||out===root)throw new Error('Unexpected build path.');
export const assets=['index.html','style.css','favicon.svg','src/paths.mjs','src/tree.mjs','src/compare.mjs','src/project.mjs','src/handoff.mjs','src/example.mjs','src/app.mjs'];
for(const path of assets.filter(p=>p.endsWith('.mjs')))execFileSync(process.execPath,['--check',resolve(root,path)]);
await rm(out,{recursive:true,force:true});await mkdir(resolve(out,'src'),{recursive:true});
for(const path of assets)await copyFile(resolve(root,path),resolve(out,path));
console.log('Built Branchbrief: '+assets.length+' assets in dist/');
