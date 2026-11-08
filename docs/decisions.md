# Decisions log

Every call the Builder makes that the specs did not make. Also: installed dependency versions, any deviation from a spec (with the reason), any a11y "moderate" finding left in place (with justification), and any tuning of motion values after watching them.

Format:

```
### D-<n> · <YYYY-MM-DD> · <short title>
Context: what was unclear or what forced the choice.
Decision: what was chosen.
Why: one or two lines, referencing the quality bar or a spec section.
```

## Pre-made decisions (from the planning conversation, for context)

These were decided with the owner before the build and are reflected in the specs. Listed so you do not relitigate them.

- D-0.1 · Framework and styling: React + TypeScript + Vite, SCSS modules, no styling or component libraries; GSAP, Zustand, dnd-kit and Lucide allowed in Brandon's Mode only.
- D-0.2 · Faithful mode is static and never reads the store. Mode is never persisted.
- D-0.3 · Visual direction "Paper" (option A of the canvas derby), with the RainFocus grape and berry kept as accents, dark theme included, light as the default.
- D-0.4 · Every nav item is a fully working feature (no lightweight views).
- D-0.5 · Mobile parity through one responsive codebase with purpose-built mobile components where needed.
- D-0.6 · No sound design, no onboarding tour, no analytics dashboard, no "what changed" panel.
- D-0.7 · Realistic fake data, generated deterministically.
- D-0.8 · The pill: bottom right, Dual chase border (option 4 of the border derby), attention beats until the first click, label flips to "View original".
- D-0.9 · The mode transition: "Pull back · rise" with a continuous crossfade so two solid pages are never on screen together.
- D-0.10 · Hover motion is slow (420 ms in, 560 ms out); no shimmer effects; no hover affordance on non-interactive text; Step 1 in Brandon's Mode fills its row.
- D-0.11 · No em dashes anywhere.
- D-0.12 · The title is "RainFocus Summit · Claude" in every mode.
- D-0.13 · The deliverable zip excludes the build kit (`docs/`, `reference/figma/`, `reference/prototypes/`, `CLAUDE.md`, `.claude/`, `START_PROMPT.md`) and the visual captures; it keeps `reference/faithful/` so the test suite runs from the zip.

## Builder decisions

(entries start below)

### D-1 · 2026-11-07 · Installed versions
Context: 03-architecture asks for exact versions.
Decision: react 19.3.1, react-dom 19.3.1, typescript 5.9.3, vite 8.3.6, @vitejs/plugin-react 6.2.1, sass 1.108.1, vite-plugin-singlefile 2.3.4, gsap 3.15.1, zustand 5.1.0, @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, @dnd-kit/utilities 3.2.2, lucide-react 1.70.0, @fontsource-variable/inter 5.3.0, @playwright/test 1.65.0, @axe-core/playwright 4.14.0, pixelmatch 8.0.0, pngjs 7.0.0, @faker-js/faker 10.6.0, eslint 9.39.5, @eslint/js 9.39.5, typescript-eslint 8.72.1, eslint-plugin-react-hooks 7.1.1, eslint-plugin-jsx-a11y 6.10.2, globals 17.14.0, archiver 8.0.0.
Why: TypeScript pinned to 5.x because the spec names TypeScript 5 (npm's latest is 6). ESLint pinned to 9 because eslint-plugin-jsx-a11y does not yet declare ESLint 10 support.

### D-2 · 2026-11-07 · Seed surnames
Context: 16-data-model asks for faker.person.lastName(). Faker's en and en_US surname lists produce invented names ("Pfannerstill", "Kuhic", "MacGyver") that read as fake, against quality bar principle 5 (real data).
Decision: first names come from faker (fakerEN_US, full spread). Surnames come from a curated list of about 300 common US surnames across origins, picked with faker's seeded RNG, so the output stays deterministic.
Why: names must look like a real event's data; determinism is unchanged.

### D-3 · 2026-11-07 · Scripts layout
Context: 03 lists verify as a chain of npm scripts and asks for a summary table.
Decision: `npm run verify` runs `scripts/verify.mjs`, which executes the same chain in the same order, fails fast and prints the table. `gate:build` builds then runs `scripts/verify-build.mjs`, which does the static external-reference check and runs `tests/gates/build.spec.ts` in Chromium and WebKit against `BUILD_HTML` (default `build/index.html`); `package.mjs` reuses it with the unzipped path. Playwright projects: `chromium` (all suites), `webkit` (e2e smoke only), `build-chromium` and `build-webkit` (build gate only).
Why: one source of truth for each check; the package step can verify the unzipped copy with the same test.

### D-4 · 2026-11-07 · Zip includes the root index.html
Context: 21-delivery lists the files to zip; the Vite entry `index.html` is not named but `npm run build` needs it.
Decision: include the root `index.html` in the zip.
Why: the zip must build from source as well as open from `build/`.

### D-5 · 2026-11-07 · No color-scheme meta tag
Context: a `color-scheme` meta would let the OS theme tint default controls and scrollbars in faithful mode.
Decision: no meta tag; `color-scheme` is set per theme on `:root[data-theme]` for Brandon's Mode, and the faithful layer pins `color-scheme: light`.
Why: a dark OS or a persisted dark theme must have zero effect on faithful mode.

### D-6 · 2026-11-07 · Faithful a11y exceptions and additions
Context: 18-accessibility and 19-testing allow exactly one exception on faithful mode: `color-contrast` is disabled because the design's #777777 labels are below AA on white.
Decision: that rule is the only one disabled. Two invisible additions keep the rest of axe green without changing a pixel: the user link's accessible name is "FL, First Name Last Name" (label in name, WCAG 2.5.3), and below 900 px the open drawer is a modal dialog (focus moves in, Tab is trapped, Escape and the scrim close it, focus returns to the menu button; the closed drawer is `inert`).
Why: faithful mode must reproduce the design exactly; accessibility fixes that do not render are allowed and expected.
