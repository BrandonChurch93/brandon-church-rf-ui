# 03 · Architecture

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Build | Vite (latest stable) | `base: './'` so the build opens from `file://`. |
| UI | React 19 + TypeScript 5 (strict) | Function components, hooks. No class components. |
| Styles | Sass (Dart Sass via the `sass` package), SCSS modules | `*.module.scss` per component, `@use` for shared tokens and mixins. Global tokens are emitted as CSS custom properties so the theme can switch at runtime. |
| Fonts | `@fontsource-variable/inter` | Self-hosted, inlined into the build. Do not import the package's CSS (it pulls five subsets). Write one `@font-face` in `globals.scss` pointing at `@fontsource-variable/inter/files/inter-latin-wght-normal.woff2` with `font-weight: 100 900` and `format('woff2-variations')`, which is the exact file the reference recreation uses, so both render identically. No Google Fonts link anywhere in the app. |
| Motion | `gsap` (3.13 or later; all plugins are free) with the `Flip` plugin | Timelines for the pill, the mode transition, list reflows, expand and collapse. CSS transitions for simple hover and color changes. |
| State | `zustand` with the `persist` middleware | One store, sliced by domain. `localStorage` persistence under one key. |
| Drag and drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Card reorder, type reorder, agenda moves. Keyboard sensor enabled everywhere it is used. |
| Icons | `lucide-react` | One set, 1.75 px stroke at 18 to 20 px. The faithful mode uses its own decoded SVGs, never Lucide. |
| Single-file build | `vite-plugin-singlefile` | Inlines JS, CSS, fonts and images into `build/index.html`. |
| Tests | `@playwright/test`, `@axe-core/playwright`, `pixelmatch`, `pngjs` (dev only) | E2E, visual captures, pixel gate, a11y gate, file:// build gate. Chromium is the gate browser; also run WebKit for the smoke suite. |
| Seed data | `@faker-js/faker` (dev only) | Generates JSON once via a script; the app imports JSON. Faker is never bundled. |
| Lint | `eslint` with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` | Zero warnings policy. |
| Packaging | `archiver` (dev) | `scripts/package.mjs` builds the delivery zip. |

Nothing else without a logged decision. Explicitly not allowed: Tailwind, Bootstrap, any CSS framework, any styled component kit (MUI, Chakra, Mantine, Ant, shadcn, Radix Themes), styled-components or emotion, framer-motion (GSAP is the motion library here), moment or dayjs (use `Intl` and small helpers), lodash.

Record the exact installed versions in `docs/decisions.md` during Phase 0.

## Repository layout

```
brandon-church-rf-ui/
  CLAUDE.md                      Builder rules
  index.html                     Vite entry; carries the inline data-URI favicon and the <title>
  README.md                      Reviewer-facing readme (finished in Phase 12)
  START_PROMPT.md                The prompt the owner pasted to start you
  package.json
  vite.config.ts
  tsconfig.json                  Project-references shell
  tsconfig.app.json
  tsconfig.node.json
  eslint.config.js
  playwright.config.ts
  vercel.json
  .gitignore
  .claude/skills/partner/SKILL.md
  docs/                          This kit (specs, logs)
  reference/                     Pixel truth and prototypes (never edited)
  scripts/
    generate-seed.mjs            Faker -> src/data/seed/*.json (deterministic)
    package.mjs                  Build + verify + zip
    verify-build.mjs             Opens build/index.html over file:// in Chromium and asserts
  src/
    main.tsx
    app/
      App.tsx                    Providers, ModeStage
      ModeStage.tsx              Mounts the faithful and paper layers, runs the transition
      Pill.tsx                   The mode toggle
      pill.module.scss
    faithful/                    Faithful mode. Static. No imports from paper/ or store/.
      FaithfulPage.tsx
      faithful.module.scss
      components/                Small presentational pieces if needed
    paper/                       Brandon's Mode
      PaperApp.tsx               Shell + router
      shell/                     Rail, Sidebar, TopBar, Drawer, BottomTabs, CommandPalette, AccountMenu, EventSwitcher, AboutPanel, SignInScreen, ToastHost
      views/
        guide/
        attendees/
        attendee-types/
        packages/
        reg-codes/
        discounts/
        content/
        exhibitors/
      ui/                        Primitives (Button, Input, Sheet, Modal, Menu, Table, ...)
      hooks/                     useMediaQuery, useHashRoute, useHotkey, useFocusTrap, useReducedMotion, ...
    store/
      store.ts                   create + persist
      types.ts                   Entity types (16-data-model.md)
      slices/                    events, attendees, types, packages, regCodes, discounts, sessions, exhibitors, guide, ui
      selectors.ts
      undo.ts                    Inverse-operation stack used by toasts
      seed.ts                    Loads seed JSON into a fresh store
    dev/
      Gallery.tsx                Primitives gallery, dev only (#dev-gallery)
    data/
      seed/                      Generated JSON (committed)
      author.ts                  Owner details for the About panel
    motion/
      tokens.ts                  Durations and eases as JS constants (mirrors tokens.scss)
      modeTransition.ts          The Pull back · rise timeline
      pillIdle.ts                Entrance and idle loop
      flip.ts                    Helpers around GSAP Flip for list reflows
    styles/
      tokens.scss                Paper tokens, light and dark, emitted as CSS variables
      faithful-tokens.scss       Figma values for faithful mode
      globals.scss               Reset, base typography, focus ring, scrollbar styling
      mixins.scss                Breakpoints, elevation, truncation, visually-hidden
    assets/
      icons/                     Decoded Figma SVGs for faithful mode
      images/                    Event logo (cropped square + rail size + original)
  tests/
    e2e/                         One spec per view and per shell feature
    gates/
      faithful.spec.ts           Pixel gate
      a11y.spec.ts               axe gate
      build.spec.ts              file:// build gate
      motion.spec.ts             Transition timing and long-task gate
    visual/
      capture.spec.ts            Screenshot catalog, both modes, both themes, five widths
      primitives.spec.ts         Captures the dev gallery in both themes
      __captures__/              Output (committed so the Partner can review)
  build/                         Output (gitignored)
```

## Modes and the stage

`ModeStage` owns `mode: 'faithful' | 'paper'` and `transitioning: boolean`. It renders:

- `<div class="layer layer--faithful">` with `FaithfulPage` (always mounted while in faithful mode or transitioning).
- `<div class="layer layer--paper">` with `PaperApp` (mounted while in paper mode or transitioning).
- `<Pill />` outside both layers, `position: fixed`.
- Transition chrome: a dim overlay and nothing else (the transition needs no edge element).

The stage is `position: fixed; inset: 0; perspective: 1600px; perspective-origin: 50% 40%` (a full-viewport element, so the containing block it creates for fixed descendants equals the viewport). Each layer is `position: absolute; inset: 0; overflow: auto` inside it and is its own scroll container. During the transition the outgoing layer gets the `is-card` class (radius, shadow, `overflow: hidden` to freeze its scroll) and both layers get `will-change: transform, opacity`; both are cleared when the timeline completes. The outgoing layer unmounts after completion. Exact timeline: `06-motion.md`.

Mode is in React state only. It is never persisted. A reload always lands on faithful mode. Faithful mode never reads the store; it is a static recreation. While a transition runs the stage carries `data-transitioning="true"`; this attribute is how tests wait on transition state; the motion gate additionally drives the live timeline through `window.__rf.transition` (`19-testing.md`).

`PaperApp` can be lazy-loaded (`React.lazy`) and preloaded on pill hover or on idle after first paint, so that the first click never waits. Ensure the transition does not start until the paper chunk has loaded; if the click arrives first, show the pill's press state and start the moment the chunk resolves (this will be sub-100 ms in practice because of preloading).

## Routing

Brandon's Mode uses the URL hash for the active view and nothing else:

| Hash | View |
|---|---|
| (none) or `#guide` | Event setup guide |
| `#attendees` | Attendees |
| `#attendee-types` | Attendee types |
| `#packages` | Packages |
| `#reg-codes` | Reg codes |
| `#discounts` | Discounts |
| `#content` | Content |
| `#exhibitors` | Exhibitors |

`useHashRoute()` reads and writes `location.hash` and listens to `hashchange`. Faithful mode ignores the hash. When the user enters Brandon's Mode, the view comes from the hash if it is valid, otherwise Guide. Unknown hashes fall back to Guide and are rewritten. Nothing else (sheet open state, selection, filters) goes in the URL. No query strings. No pushState paths. This keeps `file://` and Vercel behaving identically.

## State model

One Zustand store, persisted to `localStorage` under the key `rf-ui.v1`. Shape (abridged; full entities in `16-data-model.md`):

```ts
{
  version: 1,
  activeEventId: string,
  events: Record<EventId, EventRecord>,      // each event owns its own data
  ui: {
    theme: 'light' | 'dark' | 'system',       // default 'light'
    reduceMotion: boolean | null,             // null = follow system
    sidebarGroups: Record<string, boolean>,   // expanded state per nav group
    recentCommands: string[],                 // palette recents, max 5
    guideShowAll: Record<StepId, boolean>,
    signedOut: boolean,
  },
}
```

`EventRecord` holds: event details, attendees, attendeeTypes, packages, regCodes, discounts, sessions, tracks, exhibitors, booths, guide state (configured items, workflows, experiences), and activity entries. Switching events swaps `activeEventId`; selectors always read through the active event.

Rules:

- Mutations are store actions, named as verbs: `addAttendee`, `removeAttendees`, `reorderWorkflows`, `setTheme`. Components never write state directly.
- Every destructive action returns an `UndoToken` (an inverse operation) that the caller hands to the toast system. Undo re-applies the inverse. See `undo.ts`.
- `resetDemoData()` clears the persisted store and reseeds from `src/data/seed`. Available from the account menu with a confirm.
- Persist writes are debounced (200 ms). Store version is checked on load; a mismatch reseeds (there is only version 1 now, but build the check).
- Derived values (counts, progress, "days out") are selectors, not stored.

## Theme

`document.documentElement` carries `data-theme="light" | "dark"`. `'system'` resolves via `matchMedia('(prefers-color-scheme: dark)')` and tracks changes. Tokens live in `styles/tokens.scss` as CSS custom properties under `:root[data-theme="light"]` and `:root[data-theme="dark"]`. Only Brandon's Mode reads them; faithful mode uses `faithful-tokens.scss` (SCSS variables compiled to literal values) and never changes with theme.

Because the build ships one stylesheet (`cssCodeSplit: false`), nothing in `globals.scss` may style `html`, `body` or bare elements in a way that reaches faithful mode. Rules: `globals.scss` contains only the reset (`box-sizing`, margins, the `@font-face`) and `.sr-only`; every Paper base style (body color, background, font settings, focus ring, scrollbar styling) is scoped under `[data-layer="paper"]`; the faithful layer root (`[data-layer="faithful"]`) sets its own `background`, `color`, `font-family` and `-webkit-font-smoothing` from `faithful-tokens.scss`, exactly as the reference's `body` does, and reproduces the reference's element resets (`a`, `ul`, headings and `p`, `img`, `button`; `reference/faithful/styles.scss` lines 44 to 48) scoped under that root. A persisted dark theme must have zero effect on faithful mode; the faithful gate runs once with `data-theme="dark"` set to prove it.

Theme switch animation: `06-motion.md`.

## Breakpoints

Shared by both modes, defined once in `styles/mixins.scss` and mirrored in `hooks/useMediaQuery.ts`:

| Name | Range | Faithful mode | Brandon's Mode |
|---|---|---|---|
| xl | 1200 px and up | Design as-is | Rail + sidebar + body |
| lg | 900 to 1199 | Cards 2-up, Step 1 items 2-up | Sidebar collapses to an icon rail with flyouts |
| md | 600 to 899 | Top bar + drawer, body padding 24 | Top bar + drawer + bottom tabs, 2-column content where it fits |
| sm | 320 to 599 | Single column, padding 16 | Single column, bottom sheets, full-screen palette |

Design widths for screenshots and gates: 1447 (the Figma frame), 1024, 768, 390, 320.

## Build

`vite.config.ts`:

- `base: './'`
- `plugins: [react(), viteSingleFile()]`
- `build.outDir: 'build'`, `build.emptyOutDir: true`, `build.assetsInlineLimit` set high enough (100 MB) that every asset inlines, `build.cssCodeSplit: false`
- `css.preprocessorOptions.scss.api: 'modern-compiler'`
- `package.json` carries `"engines": { "node": "^20.19.0 || >=22.12.0" }` (the Node ranges current Vite supports)

The result is one `build/index.html` of a few MB that renders with no network and no server. The build gate in `19-testing.md` opens it over `file://` in Chromium and asserts the page renders, the title is `RainFocus Summit · Claude`, the console is clean, and the pill toggles. Also verify in WebKit.

The favicon is written directly into `index.html` as a `data:image/svg+xml` URI (the rf mark, URL-encoded). There is no `public/favicon.svg`: the single-file plugin inlines only the JS and CSS bundle, not files from `public/`, and a separate favicon file would fail the build gate's "no external references" check.

## Scripts (`package.json`)

| Script | Does |
|---|---|
| `dev` | `vite` |
| `build` | `tsc -b && vite build` |
| `preview` | `vite preview` |
| `typecheck` | `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit` (the root `tsconfig.json` is a project-references shell with no files, so a bare `tsc --noEmit` checks nothing) |
| `lint` | `eslint . --max-warnings 0` |
| `seed` | `node scripts/generate-seed.mjs` |
| `test:e2e` | Playwright e2e suite against `vite preview` |
| `test:visual` | Screenshot catalog into `tests/visual/__captures__` |
| `gate:faithful` | Pixel gate |
| `gate:a11y` | axe gate |
| `gate:motion` | Transition timing gate |
| `gate:build` | Builds, then `scripts/verify-build.mjs` over `file://` |
| `verify` | `typecheck && lint && build && test:e2e && gate:faithful && gate:a11y && gate:motion && gate:build && test:visual` |
| `package` | `verify` then `scripts/package.mjs` → `../brandon-church-rf-ui.zip` |

Playwright's config starts `vite preview` as its web server for e2e and gates (except the build gate, which uses `file://`).

## Vercel

`vercel.json`: `{ "buildCommand": "npm run build", "outputDirectory": "build", "framework": null }`. Hash routing needs no rewrites. The owner connects the repo later; you only make sure the config is present and the build is clean.

## Code conventions

- TypeScript strict. No `any` without a comment explaining why.
- Components: one folder per component when it has styles (`Button/Button.tsx`, `Button/button.module.scss`, `Button/index.ts`). Small helpers can be flat.
- SCSS modules with BEM-ish class names inside the module (`.card`, `.card__title`, `.isActive` as `&.isActive`). Shared values only through `@use '@/styles/tokens'` and `mixins`. No magic numbers; if a value is not a token, it is a named local variable with a one-line reason.
- Comments: only to explain a non-obvious why. Never narrate what the code does.
- No em dashes in strings, comments or docs.
- Accessible names on every interactive element; `aria-*` where semantics need it; native elements first (`<button>`, `<dialog>` is allowed for modals if focus management is handled; otherwise a div with the full ARIA pattern).
- Dates: store as ISO strings; format with `Intl.DateTimeFormat` in the event's timezone. Currency: `Intl.NumberFormat` with the event's currency.
- IDs: `crypto.randomUUID()` for new records; seed IDs are deterministic strings.
- Clipboard: `navigator.clipboard.writeText` with a fallback to a hidden textarea and `document.execCommand('copy')` when the API is unavailable (older WebKit over `file://`). Downloads: `Blob` + object URL + anchor click; if the build gate shows this failing over `file://` in a browser, fall back to a `data:` URL.
