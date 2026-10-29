import {fence} from './tree.mjs';import {makeReport} from './compare.mjs';import {validateProject,parseProject,normalizedList} from './project.mjs';
const $=id=>document.getElementById(id);
export function installHandoff({getState,analyze}){
  let urls=[];
  function release(){for(const u of urls)URL.revokeObjectURL(u);urls=[];}
  function url(text,type){const u=URL.createObjectURL(new Blob([text],{type}));urls.push(u);return u;}
  document.addEventListener('branchbrief:clear',release);
  document.addEventListener('branchbrief:ready',()=>{
    const state=getState();if(!state)return;
    const report=makeReport(state.before,state.after,state.diff);
    const changeText=state.diff.changes.map(c=>c.status+' '+c.path+' ('+(c.beforeKind??'absent')+' → '+(c.afterKind??'absent')+')').join('\n')||'No path/kind changes.';
    const markdown='# Branchbrief\n\nExact names and file/directory kinds only; implied directories included. No file contents or rename inference.\n\n'+Object.entries(state.diff.counts).map(([k,v])=>k+': '+v).join(' · ')+'\n\n## Current tree\n\n'+fence(state.tree)+'\n\n## Changes\n\n'+fence(changeText)+'\n\nDiagnostics: baseline '+state.before.diagnostics.length+', current '+state.after.diagnostics.length+'. See the JSON report for full diagnostic receipts.\n';
    const outputs=[['Tree TXT','branchbrief-tree.txt',state.tree,'text/plain'],['Markdown brief','branchbrief.md',markdown,'text/markdown'],['JSON report','branchbrief-report.json',JSON.stringify(report,null,2)+'\n','application/json'],['Current paths','branchbrief-paths.txt',normalizedList(state.after),'text/plain']];
    for(const [label,name,text,type] of outputs){const a=document.createElement('a');a.textContent=label;a.href=url(text,type);a.download=name;$('downloads').append(a);}
    $('save').disabled=false;
  });
  $('save').addEventListener('click',()=>{
    if(!getState())return;
    try{
      const project=validateProject({schema:'branchbrief-project-v1',before:$('before').value,after:$('after').value,label:$('label').value,ascii:$('style').value==='ascii',foldersFirst:$('folders').checked});
      const a=document.createElement('a');a.href=url(JSON.stringify(project,null,2)+'\n','application/json');a.download='branchbrief-project.json';document.body.append(a);a.click();a.remove();$('file-status').textContent='Project download requested. It includes both original lists.';
    }catch(error){$('file-status').textContent=error.message;}
  });
  $('open').addEventListener('change',async()=>{
    const file=$('open').files?.[0];if(!file)return;
    try{
      if(file.size>2000000)throw new Error('Use a project file up to 2 MB.');
      const project=parseProject(await file.text());
      for(const side of ['before','after'])$(side).value=project[side];
      $('label').value=project.label;$('style').value=project.ascii?'ascii':'unicode';$('folders').checked=project.foldersFirst;
      analyze();$('file-status').textContent='Project opened. Lists and tree options restored.';
    }catch(error){$('file-status').textContent=error.message;}
    finally{$('open').value='';}
  });
  globalThis.addEventListener('pagehide',release);
}
