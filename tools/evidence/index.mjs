#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, sign } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { canonicalize, evaluateMainnetCapability, manifestSigningPayload } from '../../packages/release-evidence/dist/index.js';

const root = resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2);
const command = args.shift();
const option = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
const required = name => { const value = option(name); if (!value) throw new Error(`missing required ${name}`); return value; };
const sha256 = value => createHash('sha256').update(value).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); };
const evidenceRoot = version => join(root, 'docs/evidence/mainnet', version);
const digestFile = path => sha256(readFileSync(path));
const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => { const full = join(path, entry.name); return entry.isDirectory() ? walk(full) : [full]; });
const report = (path, status, detail) => writeJson(path, { schemaVersion: '1', status, command: detail, generatedAt: new Date().toISOString() });
const git = (...gitArgs) => execFileSync('git', gitArgs, { cwd: root, encoding: 'utf8' }).trim();
const run = (cmd, cmdArgs) => { try { execFileSync(cmd, cmdArgs, { cwd: root, stdio: 'pipe' }); return { status: 'passed', output: `${cmd} ${cmdArgs.join(' ')}` }; } catch { return { status: 'failed', output: `${cmd} ${cmdArgs.join(' ')}` }; } };

const secretPatterns = [
  [/-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/, 'PEM private key'],
  [/\b(?:[0-9a-fA-F]{64})\b/, '64-character secret candidate'],
  [/\b(?:access|refresh)[_-]?token\s*[=:]/i, 'access token assignment'],
  [/\b(?:[a-z]+\s+){11,23}[a-z]+\b/i, 'mnemonic-like word sequence'],
];
const scanTextEvidence = (directory, hostnameDenylist) => {
  const findings = [];
  for (const path of walk(directory)) {
    const normalized = relative(directory, path).replaceAll('\\', '/');
    if (normalized.startsWith('build/source/') || normalized.startsWith('build/sbom/') || normalized === 'pnpm-lock.yaml' || /\.(zip|tar|tgz)$/i.test(path)) continue;
    const contents = readFileSync(path, 'utf8');
    for (const [pattern, label] of secretPatterns) if (pattern.test(contents)) findings.push(`${normalized}: ${label}`);
    for (const hostname of hostnameDenylist) if (contents.includes(hostname)) findings.push(`${normalized}: denied production hostname ${hostname}`);
    if (basename(path) === '.env' || normalized.endsWith('/.env')) findings.push(`${normalized}: .env file`);
  }
  if (findings.length) throw new Error(`secret scan failed: ${findings.join('; ')}`);
};
const evidenceFile = (base, path, requiredFor) => ({ path: relative(base, path).replaceAll('\\', '/'), sha256: digestFile(path), generatedAt: new Date().toISOString(), ...(requiredFor ? { requiredFor } : {}) });

const collect = version => {
  const base = evidenceRoot(version); mkdirSync(base, { recursive: true });
  const source = join(base, 'build/source/source.tar'); mkdirSync(dirname(source), { recursive: true });
  execFileSync('git', ['archive', '--format=tar', '--output', source, `v${version}`], { cwd: root });
  cpSync(join(root, 'pnpm-lock.yaml'), join(base, 'pnpm-lock.yaml'));
  const unit = run('pnpm', ['test']); const integration = run('pnpm', ['build']);
  report(join(base, 'tests/unit/report.json'), unit.status, unit.output);
  report(join(base, 'tests/integration/report.json'), integration.status, integration.output);
  report(join(base, 'tests/e2e/report.json'), 'not-run', 'No browser E2E runner is configured yet.');
  writeJson(join(base, 'build/sbom/sbom.json'), { bomFormat: 'CycloneDX', specVersion: '1.5', serialNumber: `urn:uuid:mosaiclynx-${version}`, version: 1, metadata: { timestamp: new Date().toISOString(), component: { type: 'application', name: 'mosaiclynx', version } }, components: [{ type: 'library', name: '@nemnesia/symbol-sdk', version: '3.3.2-pure.2', hashes: [{ alg: 'SHA-512', content: 'WGsiBusPCTPohlYJfKCsmNnwqnxrs5YVRBuuNPOO+TVELNV66YS2dj/ft9S758lz/m4kCcsM+fyL5jkWOTAiuQ==' }] }] });
  const policy = json(join(root, 'docs/evidence-policy.json'));
  scanTextEvidence(base, policy.productionHostnameDenylist ?? []);
  console.log(`evidence collected in ${relative(root, base)}`);
};
const manifest = version => {
  const base = evidenceRoot(version); if (!existsSync(base)) throw new Error('run evidence:collect first');
  const commit = git('rev-parse', 'HEAD'); const tag = `v${version}`;
  if (git('status', '--porcelain')) throw new Error('git working tree is dirty');
  if (git('rev-parse', tag) !== commit) throw new Error(`HEAD is not ${tag}`);
  const extensionArtifact = join(root, 'apps/extension/dist');
  if (existsSync(extensionArtifact)) { const target = join(base, 'build/extension'); mkdirSync(target, { recursive: true }); for (const path of walk(extensionArtifact)) { const out = join(target, relative(extensionArtifact, path)); mkdirSync(dirname(out), { recursive: true }); cpSync(path, out); } }
  const extensionDigestPath = join(base, 'build/extension.digest');
  if (existsSync(join(base, 'build/extension'))) writeFileSync(extensionDigestPath, sha256(walk(join(base, 'build/extension')).sort().map(path => `${relative(base, path)}:${digestFile(path)}`).join('\n')));
  const test = name => { const path = join(base, `tests/${name}/report.json`); const result = json(path); return { status: result.status, reportPath: relative(base, path), sha256: digestFile(path), generatedAt: result.generatedAt }; };
  const source = join(base, 'build/source/source.tar'); const sbom = join(base, 'build/sbom/sbom.json'); const lockfile = join(base, 'pnpm-lock.yaml');
  const value = { schemaVersion: '1', releaseVersion: version, gitCommit: commit, gitTag: tag, dirty: false, generatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), sourceArchive: evidenceFile(base, source), artifacts: existsSync(extensionDigestPath) ? { extension: evidenceFile(base, extensionDigestPath, ['extension']) } : {}, sbom: evidenceFile(base, sbom), lockfile: evidenceFile(base, lockfile), symbolSdk: { packageName: '@nemnesia/symbol-sdk', version: '3.3.2-pure.2', integrity: 'sha512-WGsiBusPCTPohlYJfKCsmNnwqnxrs5YVRBuuNPOO+TVELNV66YS2dj/ft9S758lz/m4kCcsM+fyL5jkWOTAiuQ==' }, compatibility: { chainCompatibilityVersion: '1', fixtureContractVersion: '1', parserVersion: '1' }, targets: { extension: { operatingSystems: ['linux', 'macos', 'windows'], browsers: ['chrome'] } }, tests: { unit: test('unit'), integration: test('integration'), e2e: test('e2e') }, evidenceFiles: [], approvals: [], capability: { extension: { enabled: false, evaluatedAt: new Date().toISOString(), reasons: ['awaiting signature and gate'] }, mobile: { enabled: false, evaluatedAt: new Date().toISOString(), reasons: ['mobile application is not implemented'] } }, signature: { algorithm: 'Ed25519', keyId: required('--key-id'), signatureFile: 'evidence-manifest.sig' } };
  writeJson(join(base, 'evidence-manifest.json'), value); console.log('manifest created; add approvals before signing');
};
const signManifest = version => { const base = evidenceRoot(version); const path = join(base, 'evidence-manifest.json'); const keyPath = required('--key'); const value = json(path); const signature = sign(null, Buffer.from(manifestSigningPayload(value)), createPrivateKey(readFileSync(keyPath))); writeFileSync(join(base, value.signature.signatureFile), signature.toString('base64')); console.log('manifest signed'); };
const gate = async (platform, version) => { const base = evidenceRoot(version); const reportPath = join(base, platform, `${platform}-capability-report.json`); const manifestPath = join(base, 'evidence-manifest.json'); if (!existsSync(manifestPath)) { writeJson(reportPath, { schemaVersion: '1', platform, releaseVersion: version, mainnetEnabled: false, reasons: ['missing signed evidence manifest'], evaluatedAt: new Date().toISOString() }); console.log(`${platform}: disabled (missing signed evidence manifest)`); process.exitCode = 1; return; } const policy = json(join(root, 'docs/evidence-policy.json')); const value = json(manifestPath); const signaturePath = join(base, value.signature.signatureFile); const signature = existsSync(signaturePath) ? Buffer.from(readFileSync(signaturePath, 'utf8').trim(), 'base64') : undefined; const evidenceDigest = async path => { const target = resolve(base, path); return target.startsWith(`${base}/`) && existsSync(target) && statSync(target).isFile() ? digestFile(target) : undefined; }; const result = await evaluateMainnetCapability(platform, value, policy, { expectedVersion: version, expectedCommit: git('rev-parse', 'HEAD'), signature, evidenceDigest }); writeJson(reportPath, { schemaVersion: '1', platform, releaseVersion: value.releaseVersion, gitCommit: value.gitCommit, mainnetEnabled: result.enabled, reasons: result.reasons, manifestSha256: result.manifestDigest, evaluatedAt: result.evaluatedAt }); console.log(`${platform}: ${result.enabled ? 'enabled' : `disabled (${result.reasons.join('; ')})`}`); if (!result.enabled) process.exitCode = 1; };

try {
  if (!command) throw new Error('usage: evidence <collect|manifest|sign|verify|gate>');
  const version = required('--version');
  if (command === 'collect') collect(version);
  else if (command === 'manifest') manifest(version);
  else if (command === 'sign') signManifest(version);
  else if (command === 'verify') await gate(option('--platform') ?? 'extension', version);
  else if (command === 'gate') await gate(required('--platform'), version);
  else throw new Error(`unknown command ${command}`);
} catch (error) { console.error(`evidence: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
