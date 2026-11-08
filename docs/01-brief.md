# 01 · The RainFocus brief and what it implies

## The instructions, verbatim

> **Challenge Instructions:**
> - Goal: Build a single-page application that matches the provided Figma design.
> - Framework: Use React, Next.js, or Svelte.
> - Styling: Use SCSS compiled to CSS (SASS).
> - Assets: Export icons and images from the Figma file.
> - Fidelity: Build the page as you see it in the design.
> - Optional: You may add extra functionality, but it is not required.
>
> **Constraints:**
> - We expect you to use AI but please do not have AI build the project for you. We want to see your personal problem-solving approach.
> - For the layout, please do not use bootstrap, tailwind, or other styling libraries and build from scratch. Add your agent name to the end of the title of the page inside `<title>`.
>
> **Delivery:**
> - Upload your project to a code sandbox then send us the link to view the finished product and associated files.
> - Compile locally and export to a build folder that includes an index file.
> - Remove your node-modules or other large folders.
> - Zip your whole project (src and build) and email it to RainFocus.
> - Title your folder and zip file "firstname-lastname-rf-ui".
> - Please write instructions on how to run your app if applicable in some kind of readme file before sending.
>
> The page should be full width on a normal desktop and responsive down to 320px, interpret mobile how you see fit. We should be able to unzip, load the build file into the browser, and see the completed work without having to build ourselves.
>
> If you are invited to a team interview, we'll invite you to a zoom meeting and ask you to share your project with us through zoom. During the interview we'll have you share your screen and update your project with edits like font sizes, colors, or widths to see how you work.

## What each line means for the build

| Instruction | Our implementation |
|---|---|
| Single-page application | One Vite + React app, no server. Views in Brandon's Mode switch by hash; faithful mode is one page. |
| React | React 19 with TypeScript. |
| SCSS compiled to CSS | Dart Sass through Vite. Every stylesheet is `.scss` (`.module.scss` for components). The compiled CSS ships in the build. Use `@use`, never `@import`. |
| Export icons and images from Figma | Done. `reference/faithful/icons/*.svg` were decoded from the Figma vector data; `reference/faithful/assets/*.png` are the embedded images. Copy them into `src/assets/`. Do not redraw them. |
| Build the page as you see it | Faithful mode. Pixel gate in `19-testing.md`. |
| Extra functionality optional | Brandon's Mode, far beyond optional. |
| Use AI, but AI must not build it | The owner's decision: he builds with Claude Code as his daily workflow and will demonstrate exactly that in the interview. The agent name goes in the title as asked. Your job is to make the result worthy of that stance. |
| No Bootstrap, Tailwind, or styling libraries | Faithful mode: zero libraries of any kind, hand-rolled SCSS. Brandon's Mode: no styling libraries either; behavior libraries (GSAP, Zustand, dnd-kit, lucide icons) are allowed, see `03-architecture.md`. No component kits (no MUI, Radix UI styled kits, shadcn, Chakra, Mantine, Ant). Every primitive is written here. |
| Agent name at the end of `<title>` | `<title>RainFocus Summit · Claude</title>`. Constant across modes and views. |
| Code sandbox link | Owner's step after you finish. Documented in `21-delivery.md`. |
| Build folder with an index file, openable from the file system | `npm run build` writes `build/index.html` as a single self-contained file (inlined JS, CSS, fonts, images) so it opens over `file://` with no server and no network. This is a hard gate; see `19-testing.md` "build gate". |
| Remove node_modules | `npm run package` builds the zip without `node_modules`, `.git`, caches, and the kit docs. |
| Zip "firstname-lastname-rf-ui" | The repo folder is already `brandon-church-rf-ui`; the zip is `brandon-church-rf-ui.zip`. |
| Readme with run instructions | `README.md` at the repo root is reviewer-facing. You finish it in Phase 12. Spec in `21-delivery.md`. |
| Full width on desktop, responsive to 320px | Both modes. Faithful mode breakpoints are in `04-faithful-mode.md`; Brandon's Mode in `17-responsive.md`. |
| Live edits in the interview | Keep the code legible and the tokens central. A reviewer will ask the owner to change a font size, a color, a width. Those must be one-line changes in obvious places: `src/styles/faithful-tokens.scss` for faithful mode, `src/styles/tokens.scss` for Brandon's Mode. Name things so a stranger can find them at a glance. |

## What "graded" means

Reviewers at RainFocus will open `build/index.html`, see the faithful page, resize their window, and read the code. That first impression is faithful mode, and it must be flawless: correct to the pixel at 1447 wide, clean at every width down to 320, no console errors, fast load. Everything else in this project exists to impress after that first impression, never at its expense.

Consequences:

- Faithful mode loads first, always. Mode is never persisted across reloads.
- The pill is the only addition to the faithful page. It sits bottom right where the design has empty space and never covers content at any breakpoint.
- Brandon's Mode code must not affect faithful mode rendering, bundle correctness, or load time in a way a reviewer would notice. Lazy-load Brandon's Mode's heavy views if it helps; the shell and transition should be ready instantly when the pill is clicked.

## The event in the design

- Event: RainFocus Summit
- Date: December 15th (we treat it as December 15, 2026)
- Location: Lehi, Utah (also written "Lehi, UT" in the sidebar)
- User: initials "FL" (First Name Last Name, per the component library)
- Organization badge: the mountain-and-sun event logo
- Setup guide copy: "See the available list of modules below. We suggest that you start with the attendee module."
- Steps: "Step 1: Base settings." / "Step 2: Build registration workflows." / "Step 3: Design post-registration experiences."
- Cards: "Attendee Registration" (3x, placeholder repetition), "Add Registration Workflow", "Attendee Portal"
- Hidden in the Figma but part of the design system: "Employee" and "Staff" registration cards, an "Attendee Calendar" card, a "Show all" control, card hover state with "Edit" and "Use template" buttons, a tooltip reading "Configure general settings before creating registration workflows."

Faithful mode reproduces exactly what is visible. Brandon's Mode uses everything, including the hidden parts, as real features.
