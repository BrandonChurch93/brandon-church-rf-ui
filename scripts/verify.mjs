// npm run verify: runs every check in order, fails fast, prints a summary table.
import { spawnSync } from 'node:child_process';

const steps = [
  ['typecheck', 'npm run typecheck'],
  ['lint', 'npm run lint'],
  ['build', 'npm run build'],
  ['e2e', 'npm run test:e2e'],
  ['gate:faithful', 'npm run gate:faithful'],
  ['gate:a11y', 'npm run gate:a11y'],
  ['gate:motion', 'npm run gate:motion'],
  ['gate:build', 'npm run gate:build'],
  ['visual', 'npm run test:visual'],
];

const only = process.argv.slice(2);
const results = [];
let failed = false;
for (const [name, cmd] of steps) {
  if (only.length && !only.includes(name)) continue;
  if (failed) {
    results.push([name, 'skipped', '']);
    continue;
  }
  const start = Date.now();
  console.log(`\n=== ${name}: ${cmd}`);
  const r = spawnSync(cmd, { stdio: 'inherit', shell: true });
  const secs = ((Date.now() - start) / 1000).toFixed(1) + ' s';
  if (r.status === 0) results.push([name, 'pass', secs]);
  else {
    results.push([name, 'FAIL', secs]);
    failed = true;
  }
}

const w = Math.max(...results.map((r) => r[0].length)) + 2;
console.log('\nverify summary');
console.log('-'.repeat(w + 20));
for (const [name, status, secs] of results) console.log(name.padEnd(w) + status.padEnd(10) + secs);
console.log('-'.repeat(w + 20));
console.log(failed ? 'verify: FAILED' : 'verify: all green');
process.exit(failed ? 1 : 0);
