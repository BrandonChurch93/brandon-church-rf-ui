// Verifies a single-file build over file://. Usage: node scripts/verify-build.mjs [path/to/index.html]
// 1. Static check: no script or stylesheet references to other files.
// 2. Runs tests/gates/build.spec.ts against the file in Chromium (full) and WebKit (render and pill).
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const file = resolve(process.argv[2] ?? 'build/index.html');
const html = readFileSync(file, 'utf8');

const external = [
  ...html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g),
  ...html.matchAll(/<link[^>]*\shref=["']([^"']+)["']/g),
].map((m) => m[1]).filter((u) => !u.startsWith('data:'));
if (external.length) {
  console.error('verify-build: external references found:', external);
  process.exit(1);
}
const mb = (statSync(file).size / 1024 / 1024).toFixed(2);
console.log(`verify-build: ${file} is ${mb} MB with no external references`);

const r = spawnSync('npx playwright test tests/gates/build.spec.ts --project=build-chromium --project=build-webkit', {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BUILD_HTML: file, PW_NO_SERVER: '1' },
});
process.exit(r.status ?? 1);
