# 00 · Start here

## Who is who

- **Owner**: Brandon Church. Design engineer. He planned this project in conversation with Claude and is handing it to you to build end to end. He will not review anything until you report completion. He then runs one refinement round through a Partner session, and ships.
- **Builder**: you, Claude Code running Opus. You own the whole build.
- **Partner**: a separate Claude Code session the owner opens after you finish (`/partner` skill, `docs/partner.md`). It reviews your work against these docs and writes your refinement prompts. You never need to coordinate with it; just leave the repo and the logs in the state these docs describe.

## What this project is for

A take-home assignment for a UI Developer role at RainFocus, deliberately taken far past the brief. The graded part (a pixel-exact recreation of one Figma page) is small and must be perfect. The showcase part ("Brandon's Mode") turns that page into a finished, premium event admin product. Reviewers will flip between the two with the pill. The point is the contrast: here is your design, built exactly; here is what I would build.

Read `docs/01-brief.md` for the actual RainFocus instructions and what they imply for delivery.

## Reading order for the whole kit

Read everything once before Phase 0. Then re-read per phase.

| # | File | What it settles |
|---|------|-----------------|
| 00 | start-here | this file |
| 01 | brief | RainFocus instructions, delivery constraints, what "graded" means |
| 02 | quality-bar | the taste and standards you must hit, with references |
| 03 | architecture | stack, dependencies, folders, state, routing, persistence, build, scripts |
| 04 | faithful-mode | the Figma page, exact numbers, pixel gate, responsive behavior |
| 05 | design-system | Paper tokens (light and dark), type, spacing, radius, shadow, icons, primitives |
| 06 | motion | motion tokens, hover language, enter and exit rules, the pill, the mode transition |
| 07 | shell | rail, sidebar, top bar, drawer, bottom tabs, command palette, menus, sheets, toasts, about, sign-in |
| 08 | view-guide | Event setup guide view |
| 09 | view-attendees | Attendees table |
| 10 | view-attendee-types | Attendee types |
| 11 | view-packages | Packages |
| 12 | view-reg-codes | Reg codes |
| 13 | view-discounts | Discounts |
| 14 | view-content | Content (agenda) |
| 15 | view-exhibitors | Exhibitors and floor map |
| 16 | data-model | entities, seed data, generators, the three events |
| 17 | responsive | breakpoints and per-view mobile behavior |
| 18 | accessibility | the a11y contract |
| 19 | testing | Playwright plan, gates, screenshot protocol, `npm run verify` |
| 20 | phases | build order with exit criteria |
| 21 | delivery | README, packaging, zip, Vercel, sandbox |
| | progress.md | your running log and completion report (template) |
| | decisions.md | your decision log (template) |
| | refinement.md | the owner's refinement notes land here later (template) |
| | partner.md | handoff for the Partner session |

Reference material (read, do not edit):

- `reference/faithful/` · the hand-built HTML + SCSS recreation of the Figma page. Pixel truth for faithful mode. Open `index.html` in a browser.
- `reference/faithful/screenshots/` · renders of the recreation at 1447x1024, 1024, 768, 375, 320 and with the mobile drawer open.
- `reference/figma/figma-design-screenshot.png` · the owner's screenshot of the Figma design.
- `reference/figma/overlay-figma-vs-recreation.png` · the recreation blended 50/50 over the Figma screenshot. This is what "pixel-exact" looks like.
- `reference/figma/figma-node-tree.txt` · every node of the design frame with position, size, padding, gap, fills, strokes, type. Decoded from the .fig file.
- `reference/prototypes/transition-derby.html` · working prototype of the pill, its idle animation, and the mode transitions. The option labeled "Pull back · rise" is the one that ships. The pill border in this file is the OLD gradient; the shipping border is in the next file.
- `reference/prototypes/pill-border-derby.html` · five pill border treatments. Option 4, "Dual chase", ships.
- `reference/prototypes/canvas-derby.html` · the three canvas directions. Option A, "Paper", ships. Its light and dark swatches are the design tokens.

The prototypes are reference for feel and timing. They were written quickly as standalone pages. Do not copy their code structure; do copy their values and choreography where the specs point to them.

## Session protocol (expanded)

1. Read `CLAUDE.md`, this file, `02-quality-bar.md`, `progress.md`, `decisions.md`.
2. Find the current phase in `progress.md`. Read that phase's entry in `20-phases.md` and every spec it lists.
3. Work. Keep `progress.md` current. Log decisions as you make them.
4. Before closing the phase: `npm run verify`, screenshots reviewed by you with your own eyes (open them), `progress.md` updated, local commit.

## After a context compaction

Compaction erases your working memory, not the repo. Assume you remember nothing. Do step 1 and 2 above again in full. Re-read the spec section for the thing you were in the middle of. Check `git status` and `git log --oneline -5` to see what landed. Then continue.

## Looking at your work

You have Playwright. Use it to render and screenshot constantly, not just in tests: after every visual change, screenshot the affected area in both themes and at least two widths, open the PNGs, and compare against the spec and the references. Trust the screenshot over your mental model of the CSS. When something looks off, fix it before moving on.

For hover, focus, open and loading states, screenshot those states specifically (hover with `page.hover`, focus with `page.focus`, open the sheet, trigger the toast). States are where polish lives and where unreviewed builds fail.

For motion, screenshot mid-transition frames (for example at 300, 650, 1000 and 1400 ms after clicking the pill) and look at them. You can also record video with Playwright's `recordVideo` and step through it. Timing values are in `06-motion.md`; what you are checking is whether the frames match the described choreography.

## Research

You may research online when a spec names a technique you are unsure of (GSAP Flip, dnd-kit sortable patterns, View Transitions API, the Kiwi format, Vite single-file builds, `@property` for animated conic gradients, Playwright screenshot comparison). Prefer official docs. Record anything non-obvious you learn in `progress.md` under "Notes for future sessions".

## Tone of the logs

Plain, factual, dated. Short lines. The owner reads `progress.md` first when he comes back; make the completion report at the end of it tell him exactly what shipped, what the gates said, and anything he should look at first.
