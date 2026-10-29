import {compareText} from './paths.mjs';
export function validateLabel(label) {
  if (typeof label !== 'string' || !label || label.length > 60 || label.trim() !== label || /[/\\\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]/u.test(label)) throw new Error('Use a root label of 1–60 printable characters without slashes or edge whitespace.');
  return label;
}
export function renderTree(manifest, { label = 'workspace', ascii = false, foldersFirst = true } = {}) {
  if (!manifest.valid) throw new Error('Fix list errors before creating a tree.');
  validateLabel(label);
  const children = new Map();
  for (const entry of manifest.entries) {
    const cut = entry.path.lastIndexOf('/'), parent = entry.path.slice(0, Math.max(0,cut));
    const items = children.get(parent) || []; items.push(entry); children.set(parent,items);
  }
  const lines = [label + '/'];
  function visit(parent, prefix) {
    const items = [...(children.get(parent) || [])].sort((a,b) => foldersFirst && a.kind !== b.kind ? (a.kind === 'directory' ? -1 : 1) : compareText(a.path,b.path));
    items.forEach((entry, i) => {
      const last = i === items.length - 1, name = entry.path.slice(entry.path.lastIndexOf('/')+1);
      lines.push(prefix + (ascii ? (last ? '\\-- ' : '|-- ') : (last ? '└── ' : '├── ')) + name + (entry.kind === 'directory' ? '/' : ''));
      if (entry.kind === 'directory') visit(entry.path, prefix + (last ? '    ' : ascii ? '|   ' : '│   '));
    });
  }
  visit('', '');
  return lines.join('\n') + '\n';
}
export function fence(text) {
  const longest = Math.max(2,...[...text.matchAll(/`+/g)].map(m=>m[0].length));
  const mark = '`'.repeat(longest+1);
  return mark + 'text\n' + text + (text.endsWith('\n') ? '' : '\n') + mark;
}
export function treePreview(tree, maxLines = 500) {
  const lines = tree.trimEnd().split('\n');
  return { text: lines.slice(0,maxLines).join('\n'), omitted: Math.max(0,lines.length-maxLines) };
}
