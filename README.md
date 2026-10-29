# Branchbrief

**A clearer view of your file lists.** Compare two relative-path snapshots, inspect the current folder tree, and export a structural handoff without granting repository or filesystem access.

## What it does

- Turns pasted paths into a Unicode or ASCII tree, with configurable root label and folder ordering.
- Compares exact names and file/directory kinds, including implied directories. Shows additions, removals, kind changes and unchanged counts.
- Keeps original one-based line receipts on changes and diagnostics.
- Blocks result exports on invalid input or file/directory conflicts. Merges duplicate lines with warnings.
- Flags names that match after NFC normalization and JavaScript lowercase conversion as a **hint**; preserves exact names for comparison.
- Downloads a complete tree, Markdown brief, JSON change report and canonical current path list.
- Saves/reopens an editable project locally. Edits invalidate old downloads; invalid imports preserve current work.

No account, uploads, analytics, paid services or runtime dependencies. Application code does not persist your lists. Browser session restoration and download handling depend on your browser.

## Example

The bundled fictional [project](examples/project.json) changes a small documentation/app structure. Its [report](examples/report.json) has **5 added, 1 removed, 0 kind changes and 9 unchanged paths**, including implied directories.

Actual generated [tree output](examples/tree.txt):

```text
fieldnotes/
├── docs/
│   ├── start.md
│   └── usage.md
├── public/
│   └── logo.svg
├── src/
│   ├── components/
│   │   └── Header.js
│   ├── main.js
│   └── theme.css
├── tests/
│   ├── integration/
│   └── unit/
└── README.md
```

This is genuine text output, **not a screenshot**. A real editor screenshot and native browser visual/responsive verification are pending. The interface has responsive CSS, labels, keyboard controls and status announcements; these are implementation details, not a claim of a completed accessibility audit.

## Run locally

Node.js 22 or 24 and npm:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run build
npm run dev
```

Open http://127.0.0.1:4189. The preview server binds to loopback and serves only the ten application assets from `dist/`. Stop it with Ctrl+C. Build uses Node built-ins; jsdom is a pinned **test-only** dependency.

`npm run example` regenerates the checked-in tree, report and editable project.

## Use

1. Paste one relative path per line into **Baseline** and **Current**. Leave Baseline empty to generate a single tree.
2. End a directory with `/`; otherwise the last segment is a file. Backslashes become slashes, and one leading `./` is removed. Blank lines are ignored; spaces within names are preserved.
3. Choose a root label, branch style and folder ordering. Press **Compare lists**.
4. Review errors and warnings, then inspect the tree and filter/page through change receipts.
5. Download a brief, report or current paths. **Save editable project** includes both original lists and tree settings; **Open project JSON** restores them.

For example:

```text
README.md
src/app.js
docs/quick start.md
empty-folder/
```

A path absent from Current appears as a removal **from the list**, not proof it was deleted on disk. Renames appear as removal + addition. No file content, size, date, similarity, Git status or rename detection is involved.

### Input contract

- At most **100,000 UTF-16 units and 1,000 lines per list**, including blank lines. A final newline adds a blank line.
- Maximum depth **24**; each segment at most **120 UTF-16 units**.
- No absolute paths, drive prefixes, colons, empty segments, `.`/`..` segments, edge whitespace, control/format characters, Unicode line separators or unpaired surrogates.
- Lines beginning with a double quote are rejected to avoid treating Git-quoted output as literal names.
- NUL-delimited lists, Git-quoted paths, indented outlines and `tree` command output are not import formats. Outlines/tree text are not interpreted as hierarchy; some strings may be treated literally.
- This deliberately restricted format does **not** represent every legal filesystem name.
- Names are case-sensitive and not Unicode-normalized for exact comparison. NFC + lowercase warnings are incomplete portability hints, not OS-specific case folding or a cross-platform filename validator. Reserved Windows names, trailing dots, wildcard rules and filesystem-specific equivalences are not comprehensively checked.

For ordinary repositories, `git -c core.quotePath=false ls-files` produces line-oriented relative tracked paths. Inspect the output before pasting: Git can still quote special names; this app rejects quoted lines and cannot represent filenames containing newlines. Git's `-z` format is deliberately unsupported here. See the [Git ls-files documentation](https://git-scm.com/docs/git-ls-files).

### Export scope and limits

| Output | Contains |
| --- | --- |
| Tree TXT | Full current tree, root label, chosen ordering and branch style |
| Markdown brief | Counts, full current tree, all change receipts and diagnostic counts |
| JSON report | Counts, all changes, file/directory totals and all diagnostic receipts; no complete unchanged-path inventory |
| Current paths | Sorted, deduplicated, normalized **explicit** current entries; implied directories are reconstructed when pasted back |
| Editable project | Both original lists and tree settings, including blank lines/duplicate input |

Tree preview displays the first **500 lines** and explicitly states omitted lines. Changes page at **50** records; the filter affects only the view. Diagnostics display up to **100 messages**, with the omitted count disclosed; JSON reports include all diagnostics. Downloads are complete regardless of preview/pagination/filter.

All exports contain path names, and project JSON contains the original lists. Review them before sharing. Project import is bounded to 2 MB and 1,500,000 text units; lists are validated before replacing current work. Textareas may normalize CR/CRLF endings. No disk files are read, renamed or generated from the listed paths.

## Verification

`npm test` passes **29 checks** (including the parent test and nine app-handler subtests). Coverage includes:

- Relative-path normalization, rejected input, duplicates, file/directory conflicts and name hints.
- Deterministic branches, Markdown fences that cannot be closed by filenames, and explicit preview omissions.
- Comparison symmetry and set-accounting across 50 generated cases.
- Forty normalized-list structural roundtrips and the 1,000-line boundary with 2,000 expanded entries.
- Real application handlers in **jsdom**, including inert markup, paging/filtering, export contents, stale URL cleanup, diagnostic caps, rejected imports and preservation of newer edits during asynchronous import.

CI runs tests/build on Node 22 and 24, Windows and Linux. jsdom simulates the DOM; it does **not** verify native rendering, responsive appearance, browser download destinations or assistive-technology behavior. Those checks and a real screenshot remain incomplete.

## Deploy on Vercel

Import this repository on your existing Vercel account, choose **Other** as framework, leave repository root as the root directory, set build command `npm run build` and output `dist`. `vercel.json` supplies these settings, an empty install command (build needs no dependencies), and static response headers. Choose Node 22 or 24. No environment variables, storage or paid integrations are needed.

GitHub-connected main pushes can deploy automatically. Run tests before publishing changes. This app sends no application network requests; the host still serves assets and may keep standard infrastructure logs.

## References

- [Git ls-files](https://git-scm.com/docs/git-ls-files): tracked paths and output quoting/NUL behavior.
- [Unicode normalization](https://www.unicode.org/reports/tr15/): background for the NFC name hint.

MIT licensed. No claim of complete filesystem compatibility, market validation or unique invention.
