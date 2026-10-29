import {parseManifest} from './paths.mjs';import {validateLabel} from './tree.mjs';
export function validateProject(value){
  if(!value||value.schema!=='branchbrief-project-v1'||typeof value.before!=='string'||typeof value.after!=='string'||typeof value.ascii!=='boolean'||typeof value.foldersFirst!=='boolean')throw new Error('Expected a Branchbrief v1 project with two text lists and tree options.');
  validateLabel(value.label);
  for(const side of ['before','after'])if(!parseManifest(value[side]).valid)throw new Error('Project contains invalid paths in '+side+'. Current work was preserved.');
  return {schema:'branchbrief-project-v1',before:value.before,after:value.after,label:value.label,ascii:value.ascii,foldersFirst:value.foldersFirst};
}
export function parseProject(text){if(typeof text!=='string'||text.length>1500000)throw new Error('Project JSON must be at most 1,500,000 text units.');let value;try{value=JSON.parse(text);}catch{throw new Error('Could not read project JSON. Current work was preserved.');}return validateProject(value);}
export function normalizedList(manifest){if(!manifest.valid)throw new Error('Fix list errors before export.');return manifest.entries.map(e=>e.path+(e.kind==='directory'?'/':'')).join('\n')+(manifest.entries.length?'\n':'');}
