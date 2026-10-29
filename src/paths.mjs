export const LIMITS = Object.freeze({ units: 100000, lines: 1000, depth: 24, segment: 120 });
export const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export function parseManifest(source) {
  if (typeof source !== 'string' || source.length > LIMITS.units) throw new Error('Use at most 100,000 text units per list.');
  const lines = source.split(/\r\n|\n|\r/);
  if (lines.length > LIMITS.lines) throw new Error('Use at most 1,000 lines per list, including blank lines.');
  const entries = new Map(), diagnostics = [];
  const issue = (line, code, message, severity = 'error') => diagnostics.push({ line, code, message, severity });
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], line = i + 1;
    if (raw === '') continue;
    let path = raw.replaceAll('\\', '/');
    if (path.startsWith('./')) path = path.slice(2);
    const directory = path.endsWith('/');
    if (directory) path = path.slice(0, -1);
    const parts = path.split('/');
    if (!path || path.startsWith('"') || /^[A-Za-z]:/.test(path) || path.startsWith('/') || path.includes(':') || /[\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]/u.test(path)) {
      issue(line, 'syntax', 'Use a printable relative path without a drive, colon, control or invisible format character.'); continue;
    }
    if (parts.length > LIMITS.depth || parts.some(p => !p || p === '.' || p === '..' || p.trim() !== p || p.length > LIMITS.segment)) {
      issue(line, 'segments', 'No empty, dot, parent or edge-whitespace segments; maximum depth 24 and segment length 120.'); continue;
    }
    for (let j = 0; j < parts.length; j++) {
      const key = parts.slice(0, j + 1).join('/'), kind = j < parts.length - 1 || directory ? 'directory' : 'file';
      const prior = entries.get(key);
      if (prior && prior.kind !== kind) {
        issue(line, 'kind-conflict', key + ' is both a file and a directory (first required on line ' + prior.line + ').');
      } else if (prior && j === parts.length - 1 && prior.explicit) {
        issue(line, 'duplicate', key + ' was already listed on line ' + prior.line + '.', 'warning');
      } else if (!prior) {
        entries.set(key, { path: key, kind, line, explicit: j === parts.length - 1 });
      } else if (j === parts.length - 1) prior.explicit = true;
    }
  }
  const groups = new Map();
  for (const entry of entries.values()) {
    const key = entry.path.normalize('NFC').toLowerCase();
    const group = groups.get(key) || [];
    group.push(entry); groups.set(key, group);
  }
  for (const group of groups.values()) if (group.length > 1) {
    issue(group[1].line, 'name-hint', 'NFC + lowercase name match: ' + group.map(e => e.path).join(' ↔ ') + '. Check the target filesystem.', 'warning');
  }
  const sorted = [...entries.values()].sort((a,b) => compareText(a.path,b.path));
  return { entries: sorted, diagnostics, valid: !diagnostics.some(d => d.severity === 'error'), files: sorted.filter(e => e.kind === 'file').length, directories: sorted.filter(e => e.kind === 'directory').length };
}
