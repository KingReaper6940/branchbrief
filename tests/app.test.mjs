import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
test('real app handlers in a simulated DOM (not native rendering)',async t=>{
 const dom=new JSDOM(await readFile(new URL('../index.html',import.meta.url),'utf8'),{url:'https://branchbrief.test/'});
 const saved=Object.fromEntries(['document','CustomEvent','addEventListener'].map(k=>[k,globalThis[k]]));
 globalThis.document=dom.window.document;globalThis.CustomEvent=dom.window.CustomEvent;globalThis.addEventListener=dom.window.addEventListener.bind(dom.window);
 const blobs=new Map();let serial=0;const create=URL.createObjectURL,revoke=URL.revokeObjectURL;
 URL.createObjectURL=b=>{const key='blob:test-'+(++serial);blobs.set(key,b);return key;};URL.revokeObjectURL=u=>blobs.delete(u);
 const $=id=>document.getElementById(id), click=id=>$(id).click(), edit=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new dom.window.Event('input'));};
 const tick=()=>new Promise(r=>setImmediate(r));
 try{
  await import('../src/app.mjs');
  await t.test('example produces a tree, exact counts and four complete handoff links',async()=>{
   assert.equal($('results').hidden,false);assert.equal($('added').textContent,'5');assert.equal($('removed').textContent,'1');assert.equal($('unchanged').textContent,'9');assert.equal($('downloads').children.length,4);
   const a=$('downloads').querySelector('a');assert.match(await blobs.get(a.href).text(),/fieldnotes\/\n/);assert.match($('tree').textContent,/Header.js/);
  });
  await t.test('edits revoke old URLs and block stale downloads until comparison',()=>{
   edit('after','only.txt');assert.equal($('results').hidden,true);assert.equal($('downloads').children.length,0);assert.equal(blobs.size,0);assert.equal($('save').disabled,true);click('compare');assert.equal($('tree-count').textContent,'1 files · 0 folders');
  });
  await t.test('errors block every result export and expose source-line diagnostics',()=>{
   edit('after','a\na/b');click('compare');assert.equal($('results').hidden,true);assert.equal($('downloads').children.length,0);assert.equal($('save').disabled,true);assert.match($('issues').textContent,/Current line 2.*both a file and a directory/);
  });
  await t.test('hostile markup stays text and case hints remain warnings',()=>{
   edit('before','');edit('after','<img onerror=alert(1)>\nREADME\nreadme');click('compare');assert.equal($('results').hidden,false);assert.equal(document.querySelectorAll('img').length,0);assert.match($('issues').textContent,/NFC/);assert.match($('tree').textContent,/<img/);
  });
  await t.test('600 changes paginate and tree preview omission is explicit; export is complete',async()=>{
   edit('after',Array.from({length:600},(_,i)=>'file'+String(i).padStart(3,'0')).join('\n'));click('compare');assert.equal($('changes').children.length,50);assert.match($('page').textContent,/page 1 \/ 12/);assert.match($('tree-limit').textContent,/101 tree lines omitted/);assert.doesNotMatch($('tree').textContent,/file599/);
   assert.match(await blobs.get($('downloads').firstChild.href).text(),/file599/);click('next');assert.match($('page').textContent,/page 2 \/ 12/);
   $('filter').value='removed';$('filter').dispatchEvent(new dom.window.Event('change'));assert.match($('page').textContent,/0 changes/);assert.equal($('next').disabled,true);
  });
  await t.test('diagnostic caps disclose omitted receipts',()=>{
   edit('after',Array(130).fill('../bad').join('\n'));click('compare');assert.equal($('issues').children.length,100);assert.match($('diagnostic-summary').textContent,/30 omitted/);assert.equal($('results').hidden,true);
  });
  await t.test('bad imports preserve source; valid projects restore lists/options',async()=>{
   const open=$('open');const original=$('after').value;
   Object.defineProperty(open,'files',{configurable:true,value:[{size:10,text:async()=>'{'}]});open.dispatchEvent(new dom.window.Event('change'));await tick();assert.equal($('after').value,original);assert.match($('file-status').textContent,/preserved/);
   const value={schema:'branchbrief-project-v1',before:'old',after:'new/',label:'Restored',ascii:true,foldersFirst:false};
   Object.defineProperty(open,'files',{configurable:true,value:[{size:100,text:async()=>JSON.stringify(value)}]});open.dispatchEvent(new dom.window.Event('change'));await tick();assert.equal($('after').value,'new/');assert.equal($('style').value,'ascii');assert.equal($('folders').checked,false);assert.match($('tree').textContent,/Restored\/\n\\-- new\//);assert.equal($('save').disabled,false);
  });
  await t.test('an import that finishes after an edit preserves newer work',async()=>{
   let finish;const pending=new Promise(r=>finish=r),open=$('open');Object.defineProperty(open,'files',{configurable:true,value:[{size:100,text:()=>pending}]});open.dispatchEvent(new dom.window.Event('change'));edit('after','newer.txt');finish(JSON.stringify({schema:'branchbrief-project-v1',before:'',after:'older.txt',label:'Old',ascii:false,foldersFirst:true}));await tick();assert.equal($('after').value,'newer.txt');assert.match($('file-status').textContent,/changed while/);
  });
  await t.test('invalid root label also disables result handoff',()=>{edit('label','bad/root');click('compare');assert.equal($('downloads').children.length,0);assert.equal($('results').hidden,true);assert.match($('status').textContent,/root label/);});
 }finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;for(const [key,value]of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}dom.window.close();}
});
