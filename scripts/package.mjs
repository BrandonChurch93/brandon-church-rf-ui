// Builds ../brandon-church-rf-ui.zip for delivery (run through `npm run package`, which verifies first).
// Contents and exclusions follow docs/21-delivery.md.
import { ZipArchive } from 'archiver';
import { createWriteStream, existsSync, mkdtempSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = resolve('.');
const NAME = 'brandon-church-rf-ui';
const ZIP = resolve(ROOT, '..', `${NAME}.zip`);

const INCLUDE = [
  'build', 'src', 'tests', 'scripts', 'reference/faithful',
  'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'playwright.config.ts', 'eslint.config.js', 'vercel.json', '.gitignore', 'README.md', 'index.html',
];
const EXCLUDE_PREFIXES = ['tests/report', 'tests/gates/__out__', 'tests/visual/__captures__', 'test-results'];
const EXCLUDE_NAMES = new Set(['.DS_Store', 'node_modules', '.git']);

function walk(path, out) {
  const st = statSync(path);
  const rel = relative(ROOT, path).split(sep).join('/');
  if (EXCLUDE_NAMES.has(path.split(sep).pop())) return;
  if (EXCLUDE_PREFIXES.some((p) => rel === p || rel.startsWith(p + '/'))) return;
  if (rel.endsWith('.log')) return;
  if (st.isDirectory()) for (const name of readdirSync(path)) walk(join(path, name), out);
  else out.push(rel);
}

const files = [];
for (const entry of INCLUDE) {
  const p = join(ROOT, entry);
  if (!existsSync(p)) {
    console.error(`package: missing ${entry}`);
    process.exit(1);
  }
  walk(p, files);
}

await new Promise((res, rej) => {
  const output = createWriteStream(ZIP);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  output.on('close', res);
  archive.on('error', rej);
  archive.pipe(output);
  for (const f of files) archive.file(join(ROOT, f), { name: `${NAME}/${f}` });
  archive.finalize();
});

const mb = (statSync(ZIP).size / 1024 / 1024).toFixed(2);
console.log(`package: ${ZIP} · ${mb} MB · ${files.length} files`);

// Unzip into a temp folder and open the build from there over file://.
const tmp = mkdtempSync(join(tmpdir(), 'rf-ui-zip-'));
const unzip = spawnSync('unzip', ['-q', ZIP, '-d', tmp], { stdio: 'inherit' });
if (unzip.status !== 0) process.exit(1);
const forbidden = ['node_modules', 'docs', 'reference/figma', 'reference/prototypes', 'tests/visual/__captures__', 'CLAUDE.md', '.claude', 'START_PROMPT.md'];
for (const f of forbidden) {
  if (existsSync(join(tmp, NAME, f))) {
    console.error(`package: ${f} must not be in the zip`);
    process.exit(1);
  }
}
if (!existsSync(join(tmp, NAME, 'reference/faithful/index.html'))) {
  console.error('package: reference/faithful is missing from the zip');
  process.exit(1);
}
const verify = spawnSync('node', ['scripts/verify-build.mjs', join(tmp, NAME, 'build', 'index.html')], { stdio: 'inherit' });
process.exit(verify.status ?? 1);
