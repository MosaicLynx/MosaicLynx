import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalize, defaultEvidencePolicy, evaluateMainnetCapability, manifestSigningPayload, type EvidenceManifest } from '../src/index.js';

const now = '2026-07-17T00:00:00.000Z';
const digest = 'a'.repeat(64);
const file = (path: string) => ({ path, sha256: digest, generatedAt: now });
const key = generateKeyPairSync('ed25519');
const publicKey = key.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
const manifest = (): EvidenceManifest => ({ schemaVersion: '1', releaseVersion: '0.1.0', gitCommit: 'f'.repeat(40), gitTag: 'v0.1.0', dirty: false, generatedAt: now, sourceArchive: file('build/source/source.tar'), artifacts: { extension: file('build/extension.zip'), mobile: file('build/mobile.zip') }, sbom: file('build/sbom/sbom.json'), lockfile: file('pnpm-lock.yaml'), symbolSdk: { packageName: '@nemnesia/symbol-sdk', version: '3.3.2-pure.2', integrity: 'sha512-x' }, compatibility: { chainCompatibilityVersion: '1', fixtureContractVersion: '1', parserVersion: '1' }, targets: { extension: { operatingSystems: ['linux'], browsers: ['chromium'] }, mobile: { operatingSystems: ['android'] } }, tests: { unit: { status: 'passed', reportPath: 'tests/unit/report.json', sha256: digest, generatedAt: now }, integration: { status: 'passed', reportPath: 'tests/integration/report.json', sha256: digest, generatedAt: now }, e2e: { status: 'passed', reportPath: 'tests/e2e/report.json', sha256: digest, generatedAt: now } }, evidenceFiles: [], approvals: [{ approverId: 'owner', role: 'release', approvedAt: now, platform: 'both', status: 'approved' }], capability: { extension: { enabled: true, evaluatedAt: now, reasons: [] }, mobile: { enabled: true, evaluatedAt: now, reasons: [] } }, signature: { algorithm: 'Ed25519', keyId: 'test', signatureFile: 'evidence-manifest.sig' } });
describe('release evidence', () => {
  it('canonicalizes object keys', () => expect(canonicalize({ b: 1, a: [true] })).toBe('{"a":[true],"b":1}'));
  it('enables an independently signed extension manifest', async () => { const value = manifest(); const signature = sign(null, Buffer.from(manifestSigningPayload(value)), key.privateKey); await expect(evaluateMainnetCapability('extension', value, defaultEvidencePolicy({ test: publicKey }), { now: new Date(now), signature })).resolves.toMatchObject({ enabled: true }); });
  it('fails a missing mobile artifact and strict approval policy', async () => { const value = manifest(); const signature = sign(null, Buffer.from(manifestSigningPayload(value)), key.privateKey); const mobile = { ...value, artifacts: { extension: value.artifacts.extension } }; await expect(evaluateMainnetCapability('mobile', mobile, defaultEvidencePolicy({ test: publicKey }), { now: new Date(now), signature })).resolves.toMatchObject({ enabled: false }); const strict = { ...defaultEvidencePolicy({ test: publicKey }), mode: 'strict' as const, requiredApprovals: { release: 1, security: 1 }, minimumDistinctApprovers: 2, allowSameApproverMultipleRoles: false }; await expect(evaluateMainnetCapability('extension', value, strict, { now: new Date(now), signature })).resolves.toMatchObject({ enabled: false }); });
  it('fails an evidence digest mismatch', async () => { const value = manifest(); const signature = sign(null, Buffer.from(manifestSigningPayload(value)), key.privateKey); await expect(evaluateMainnetCapability('extension', value, defaultEvidencePolicy({ test: publicKey }), { now: new Date(now), signature, evidenceDigest: async () => 'b'.repeat(64) })).resolves.toMatchObject({ enabled: false }); });
  it.each([
    ['expired manifest', (value: EvidenceManifest) => ({ ...value, generatedAt: '2026-05-01T00:00:00.000Z' })],
    ['dirty tree', (value: EvidenceManifest) => ({ ...value, dirty: true })],
    ['failed test', (value: EvidenceManifest) => ({ ...value, tests: { ...value.tests, e2e: { ...value.tests.e2e, status: 'failed' } } })],
    ['unknown schema', (value: EvidenceManifest) => ({ ...value, schemaVersion: '999' })],
    ['unknown signature algorithm', (value: EvidenceManifest) => ({ ...value, signature: { ...value.signature, algorithm: 'unknown' } })],
    ['insufficient approvals', (value: EvidenceManifest) => ({ ...value, approvals: [] })],
  ])('fails %s', async (_name, change) => {
    const value = change(manifest()) as EvidenceManifest;
    const signature = sign(null, Buffer.from(manifestSigningPayload(value)), key.privateKey);
    await expect(evaluateMainnetCapability('extension', value, defaultEvidencePolicy({ test: publicKey }), { now: new Date(now), signature })).resolves.toMatchObject({ enabled: false });
  });
});
