import {compareText} from './paths.mjs';
export function compareManifests(before, after) {
  if (!before.valid || !after.valid) throw new Error('Fix errors in both lists before comparison.');
  const left = new Map(before.entries.map(e=>[e.path,e])), right = new Map(after.entries.map(e=>[e.path,e]));
  const paths = [...new Set([...left.keys(),...right.keys()])].sort(compareText);
  const changes = [], counts = {added:0,removed:0,type:0,unchanged:0};
  for (const path of paths) {
    const a=left.get(path), b=right.get(path);
    const status = !a ? 'added' : !b ? 'removed' : a.kind !== b.kind ? 'type' : 'unchanged';
    counts[status]++;
    if(status !== 'unchanged') changes.push({path,status,beforeKind:a?.kind??null,afterKind:b?.kind??null,beforeLine:a?.line??null,afterLine:b?.line??null});
  }
  return {counts,changes};
}
export function makeReport(before, after, comparison) {
  return {schema:'branchbrief-report-v1', scope:'Exact relative paths and file/directory kinds, including implied directories. No file contents or rename inference.',
    before:{files:before.files,directories:before.directories,diagnostics:before.diagnostics},
    after:{files:after.files,directories:after.directories,diagnostics:after.diagnostics},...comparison};
}
