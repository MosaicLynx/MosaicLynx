import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../..');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const reportPath = join(root, 'docs/evidence/mainnet', version, 'extension/extension-capability-report.json');
let report = { mainnetEnabled: false, reasons: ['release evidence is not installed'] };
try {
  if (existsSync(join(root, 'docs/evidence/mainnet', version, 'evidence-manifest.json')))
    execFileSync('node', ['tools/evidence/index.mjs', 'gate', '--platform', 'extension', '--version', version], { cwd: root, stdio: 'ignore' });
  if (existsSync(reportPath)) report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch {
  // A failed gate intentionally produces a Testnet-only build.
}
writeFileSync(join(root, 'apps/extension/.release-capabilities.json'), `${JSON.stringify({ enabled: report.mainnetEnabled === true, reasons: report.reasons ?? [] })}\n`);
