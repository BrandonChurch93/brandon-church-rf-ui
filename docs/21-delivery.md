# 21 · Delivery

What leaves this repo and how. You (the Builder) produce the artifacts; the owner does the uploading, the GitHub remote and the Vercel connection after the refinement round.

## README.md (reviewer-facing, at the repo root)

Write it in Phase 12. Audience: RainFocus developers opening the zip. Plain, short, no marketing. Sections, in order:

1. **Title**: "RainFocus UI Challenge · Brandon Church"
2. **What this is** (3 to 5 sentences): a pixel-faithful build of the provided Figma page in React + SCSS, responsive to 320 px, plus an optional "Brandon's Mode" reachable from the pill at the bottom right that reimagines the page as a working event admin application. State that the original design is what loads and that Brandon's Mode is extra.
3. **Open without building**: "Unzip and open `build/index.html` in a browser. No server or install needed."
4. **Run locally**: prerequisites (Node 20.19 or later, or 22.12 or later, matching `engines` in `package.json`), `npm install`, `npm run dev`, `npm run build` (writes `build/`), `npm run preview`.
5. **Project structure**: a short tree of `src/` with one line per folder (faithful mode, Brandon's Mode, store, styles, tests).
6. **Design fidelity notes**: fonts (Inter self-hosted), assets exported from the Figma file, where the tokens live for live edits (`src/styles/faithful-tokens.scss`), the responsive interpretation (drawer below 900, single column below 600).
7. **Brandon's Mode**: one paragraph on what it includes (all nav items working, light and dark, mobile, local persistence, reset from the account menu) and the keyboard shortcut for the palette. Note that data is stored in the browser only.
8. **AI usage**: one honest paragraph in the owner's voice: he builds with Claude Code day to day and did here; the title carries the agent name as requested; he is happy to walk through any part of the code and make live changes. Keep it to three sentences; the owner will adjust the wording if he wants.
9. **Testing**: `npm run verify` and what it covers in one line each. Note that it needs `npm install` and `npx playwright install chromium webkit` first.
10. **Author**: Brandon Church, Design Engineer, portfolio link.

No em dashes. Sentence case headings. Under 120 lines.

## The zip (`npm run package`)

`scripts/package.mjs`:
1. Run `npm run verify` (fail if red).
2. Create `../brandon-church-rf-ui.zip` (one level above the repo) containing a top-level folder `brandon-church-rf-ui/` with:
   - `build/` (the single-file build)
   - `src/`, `tests/` (without `tests/report/`, `tests/gates/__out__/` and `tests/visual/__captures__/`, which are large), `scripts/`, and `reference/faithful/` (small; the faithful pixel gate reads it, so `npm run verify` works from the zip)
   - `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `playwright.config.ts`, `eslint.config.*`, `vercel.json`, `.gitignore`, `README.md`
3. Exclude: `node_modules/`, `.git/`, `docs/`, `reference/figma/`, `reference/prototypes/`, `CLAUDE.md`, `.claude/`, `START_PROMPT.md`, `.DS_Store`, `tests/report/`, `tests/gates/__out__/`, `tests/visual/__captures__/`, any `*.log`.
4. Print the zip size and the file count. Then unzip into a temp directory and open `brandon-church-rf-ui/build/index.html` over `file://` with Chromium to confirm it renders (reuse `verify-build.mjs` with a path argument).

Why the exclusions: `docs/`, `reference/figma/` and `reference/prototypes/` are the build kit (planning material between the owner and his tools), not part of the deliverable, and the captures are large; the brief asks for src and build and says to remove large folders. `reference/faithful/` stays because the test suite depends on it. The owner decides separately what the GitHub repo contains.

## Vercel

`vercel.json` at the root:
```json
{ "buildCommand": "npm run build", "outputDirectory": "build", "framework": null }
```
Hash routing means no rewrites. The owner connects the GitHub repo in the Vercel dashboard; nothing else is needed. Document in the README's run section that the app is a static build deployable to any static host.

## GitHub

Do not create a remote. Leave the repo with clean, phase-by-phase local commits on `main`. The owner will `git remote add origin ...` and push. Make sure `.gitignore` covers `node_modules`, `build`, `tests/report`, `tests/gates/__out__`, `.DS_Store`, `*.log`, and that `tests/visual/__captures__` IS committed.

## Code sandbox (owner's step, document it in `progress.md`'s completion report)

Options the owner can choose from; list both in the report:
- Upload the zip to CodeSandbox ("Import from zip") or StackBlitz, set the start command to `npm run dev`, and set sharing to "anyone with the link".
- Or import the GitHub repository once it exists.

## Completion report format (end of `docs/progress.md`)

```
## Completion report · <date>

Status: complete. All phases checked. `npm run verify` green on <date> (2 consecutive runs).

Build: build/index.html, <size> MB. Opens over file:// in Chromium and WebKit.
Zip: ../brandon-church-rf-ui.zip, <size> MB, <n> files. Verified by unzip and render.

Gates:
- Faithful pixel gate: 1447 <x>% · 1024 <x>% · 768 <x>% · 390 <x>% · 320 <x>%
- A11y gate: 0 serious, 0 critical, <n> moderate (listed in decisions.md)
- Motion gate: longest task <x> ms, transition <x> ms
- E2E: <n> tests passing (Chromium), <n> smoke (WebKit)

What to look at first:
1. ...
2. ...

Decisions the owner may want to revisit (from decisions.md): ...

Known limitations (should be none; if any, be exact): ...

Owner's next steps: refinement round via /partner, then create the GitHub repo and push, connect Vercel, upload the zip to a sandbox, email Elizabeth Cuadra the links and the zip.
```
