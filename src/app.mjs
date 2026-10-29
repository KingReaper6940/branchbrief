import {installHandoff} from './handoff.mjs';
import {parseManifest} from './paths.mjs';
import {renderTree,treePreview} from './tree.mjs';
import {compareManifests} from './compare.mjs';
import {EXAMPLE} from './example.mjs';
const $=id=>document.getElementById(id);
let state=null, page=0;
function clear(){document.dispatchEvent(new CustomEvent('branchbrief:clear'));state=null;$('results').hidden=true;$('diagnostics').hidden=true;$('downloads').replaceChildren();$('save').disabled=true;$('status').textContent='Inputs changed. Compare again to refresh results.';}
function receipts(){
  if(!state)return;
  const all=state.diff.changes.filter(c=>$('filter').value==='all'||c.status===$('filter').value),pages=Math.max(1,Math.ceil(all.length/50));
  page=Math.min(page,pages-1);$('changes').replaceChildren();
  for(const c of all.slice(page*50,page*50+50)){
    const item=document.createElement('div');item.className='receipt';
    const badge=document.createElement('span');badge.className='badge '+c.status;badge.textContent=c.status==='type'?'kind change':c.status;
    const path=document.createElement('code');path.textContent=c.path;
    const info=document.createElement('small');info.textContent=(c.beforeKind??'absent')+' → '+(c.afterKind??'absent')+' · baseline line '+(c.beforeLine??'—')+' / current line '+(c.afterLine??'—');
    item.append(badge,path,info);$('changes').append(item);
  }
  if(!all.length){const p=document.createElement('p');p.className='empty';p.textContent='No changes in this view. This compares names and kinds only.';$('changes').append(p);}
  $('page').textContent=all.length+' changes · page '+(page+1)+' / '+pages;$('prev').disabled=page===0;$('next').disabled=page>=pages-1;
}
export function analyze(){
  clear();$('issues').replaceChildren();page=0;
  try{
    const before=parseManifest($('before').value),after=parseManifest($('after').value);
    const issues=[...before.diagnostics.map(d=>({...d,side:'Baseline'})),...after.diagnostics.map(d=>({...d,side:'Current'}))];
    $('diagnostics').hidden=!issues.length;$('diagnostic-summary').textContent=issues.length+' diagnostics'+(issues.length>100?' · showing first 100, '+(issues.length-100)+' omitted':'');
    for(const d of issues.slice(0,100)){const li=document.createElement('li');li.textContent=d.side+' line '+d.line+' · '+d.severity+' · '+d.message;$('issues').append(li);}
    if(!before.valid||!after.valid)throw new Error('Fix the list errors above. All result exports are blocked.');
    const tree=renderTree(after,{label:$('label').value,ascii:$('style').value==='ascii',foldersFirst:$('folders').checked}),diff=compareManifests(before,after),preview=treePreview(tree);
    state={before,after,tree,diff};$('results').hidden=false;
    for(const key of ['added','removed','type','unchanged'])$(key).textContent=diff.counts[key];
    $('tree').textContent=preview.text;$('tree-limit').textContent=preview.omitted?preview.omitted+' tree lines omitted from preview; downloads include all lines.':'Full tree shown.';
    $('tree-count').textContent=after.files+' files · '+after.directories+' folders';
    $('status').textContent='Comparison ready'+(issues.length?' with '+issues.length+' warnings.':'.');receipts();
    document.dispatchEvent(new CustomEvent('branchbrief:ready',{detail:state}));
  }catch(error){$('status').textContent=error.message;}
}
for(const id of ['before','after','label'])$(id).addEventListener('input',clear);
for(const id of ['style','folders'])$(id).addEventListener('change',clear);
$('compare').addEventListener('click',analyze);
$('filter').addEventListener('change',()=>{page=0;receipts();});
$('prev').addEventListener('click',()=>{page--;receipts();});$('next').addEventListener('click',()=>{page++;receipts();});
$('example').addEventListener('click',()=>{for(const side of ['before','after'])$(side).value=EXAMPLE[side];$('label').value='fieldnotes';analyze();});
for(const side of ['before','after'])$(side).value=EXAMPLE[side];$('label').value='fieldnotes';
export const getState=()=>state;
export {clear};
installHandoff({getState,analyze});
analyze();
