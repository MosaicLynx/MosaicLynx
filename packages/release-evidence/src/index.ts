export type Platform = 'extension' | 'mobile';
export type EvidenceStatus = 'passed' | 'failed' | 'not-run' | 'not-required';

export interface EvidenceFile {
  readonly path: string;
  readonly sha256: string;
  readonly generatedAt?: string;
  readonly expiresAt?: string;
  readonly requiredFor?: readonly Platform[];
}
export interface EvidenceResult {
  readonly status: EvidenceStatus;
  readonly reportPath?: string;
  readonly sha256?: string;
  readonly generatedAt?: string;
  readonly expiresAt?: string;
}
export interface ReleaseApproval {
  readonly approverId: string;
  readonly role: 'release' | 'security';
  readonly approvedAt: string;
  readonly platform: Platform | 'both';
  readonly status: 'approved' | 'rejected';
}
export interface CapabilityDecision { readonly enabled: boolean; readonly evaluatedAt: string; readonly reasons: readonly string[]; }
export interface EvidenceManifest {
  readonly schemaVersion: '1'; readonly releaseVersion: string; readonly gitCommit: string; readonly gitTag: string; readonly dirty: false;
  readonly generatedAt: string; readonly expiresAt?: string;
  readonly sourceArchive: EvidenceFile; readonly artifacts: { readonly extension?: EvidenceFile; readonly mobile?: EvidenceFile };
  readonly sbom: EvidenceFile; readonly lockfile: EvidenceFile;
  readonly symbolSdk: { readonly packageName: string; readonly version: string; readonly integrity: string };
  readonly compatibility: { readonly chainCompatibilityVersion: string; readonly fixtureContractVersion: string; readonly parserVersion: string };
  readonly targets: { readonly extension?: { readonly operatingSystems: readonly string[]; readonly browsers: readonly string[] }; readonly mobile?: { readonly operatingSystems: readonly string[]; readonly architectures?: readonly string[] } };
  readonly tests: { readonly unit: EvidenceResult; readonly integration: EvidenceResult; readonly e2e: EvidenceResult; readonly differential?: EvidenceResult; readonly fuzz?: EvidenceResult };
  readonly evidenceFiles: readonly EvidenceFile[]; readonly approvals: readonly ReleaseApproval[];
  readonly capability: { readonly extension: CapabilityDecision; readonly mobile: CapabilityDecision };
  readonly signature: { readonly algorithm: 'Ed25519'; readonly keyId: string; readonly signatureFile: string };
}
export interface EvidencePolicy {
  readonly schemaVersion: '1'; readonly mode: 'lite' | 'strict';
  readonly requiredApprovals: { readonly release: number; readonly security: number };
  readonly minimumDistinctApprovers?: number; readonly allowSameApproverMultipleRoles?: boolean;
  readonly maxEvidenceAgeDays: number; readonly trustedKeys: Readonly<Record<string, string>>;
}
export interface MainnetCapabilityEvaluation { readonly platform: Platform; readonly enabled: boolean; readonly reasons: readonly string[]; readonly manifestDigest?: string; readonly evaluatedAt: string; }

const encoder = new TextEncoder();
const bufferSource = (bytes: Uint8Array): ArrayBuffer => bytes.slice().buffer as ArrayBuffer;
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const validDigest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const validTime = (value: string | undefined, now: number): boolean => !!value && Number.isFinite(Date.parse(value)) && Date.parse(value) <= now;

/** RFC 8785 JSON Canonicalization Scheme for the JSON values accepted by manifests. */
export const canonicalize = (value: unknown): string => {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw new Error('JCS rejects non-finite numbers'); return JSON.stringify(value); }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (!isRecord(value)) throw new Error('JCS rejects unsupported values');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
};
export const sha256 = async (value: string | Uint8Array): Promise<string> => {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bufferSource(bytes)));
  return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
};
export const manifestSigningPayload = (manifest: EvidenceManifest): string => {
  const { signature: _signature, ...unsigned } = manifest;
  return canonicalize(unsigned);
};
export const defaultEvidencePolicy = (trustedKeys: Readonly<Record<string, string>> = {}): EvidencePolicy => ({
  schemaVersion: '1', mode: 'lite', requiredApprovals: { release: 1, security: 0 }, maxEvidenceAgeDays: 30,
  allowSameApproverMultipleRoles: true, trustedKeys,
});

const evidenceExpired = (item: { readonly generatedAt?: string; readonly expiresAt?: string }, policy: EvidencePolicy, now: number): boolean => {
  if (!validTime(item.generatedAt, now)) return true;
  if (item.expiresAt && (!validTime(item.expiresAt, now) || Date.parse(item.expiresAt) < now)) return true;
  return now - Date.parse(item.generatedAt!) > policy.maxEvidenceAgeDays * 86_400_000;
};
const platformFile = (file: EvidenceFile, platform: Platform): boolean => !file.requiredFor?.length || file.requiredFor.includes(platform);

export const evaluateMainnetCapability = async (platform: Platform, manifest: EvidenceManifest, policy: EvidencePolicy, options: { readonly now?: Date; readonly expectedVersion?: string; readonly expectedCommit?: string; readonly signature?: Uint8Array; readonly evidenceDigest?: (path: string) => Promise<string | undefined> } = {}): Promise<MainnetCapabilityEvaluation> => {
  const now = options.now?.getTime() ?? Date.now(); const reasons: string[] = [];
  const add = (condition: boolean, reason: string): void => { if (condition) reasons.push(reason); };
  try {
    add(manifest.schemaVersion !== '1' || policy.schemaVersion !== '1', 'unsupported schema version');
    add(manifest.dirty !== false, 'git working tree is dirty');
    add(!manifest.releaseVersion || !manifest.gitCommit || !manifest.gitTag, 'release identity is incomplete');
    add(!!options.expectedVersion && manifest.releaseVersion !== options.expectedVersion, 'release version does not match build');
    add(!!options.expectedCommit && manifest.gitCommit !== options.expectedCommit, 'git commit does not match build');
    add(evidenceExpired(manifest, policy, now), 'manifest is expired or lacks generatedAt');
    const required = [manifest.sourceArchive, manifest.sbom, manifest.lockfile, ...manifest.evidenceFiles.filter(file => platformFile(file, platform))];
    const artifact = manifest.artifacts[platform];
    add(!artifact, `missing ${platform} build artifact`);
    if (artifact) required.push(artifact);
    for (const file of required) {
      add(!file.path || !validDigest(file.sha256), `invalid digest: ${file.path || 'unnamed evidence'}`);
      add(evidenceExpired(file, policy, now), `expired evidence: ${file.path}`);
      if (options.evidenceDigest && file.path) add((await options.evidenceDigest(file.path))?.toLowerCase() !== file.sha256.toLowerCase(), `digest mismatch: ${file.path}`);
    }
    for (const name of ['unit', 'integration', 'e2e'] as const) { const test = manifest.tests[name]; add(test.status !== 'passed', `required ${name} test did not pass`); add(evidenceExpired(test, policy, now), `expired ${name} test evidence`); add(!test.reportPath || !validDigest(test.sha256), `invalid ${name} test report`); if (options.evidenceDigest && test.reportPath) add((await options.evidenceDigest(test.reportPath))?.toLowerCase() !== test.sha256?.toLowerCase(), `digest mismatch: ${test.reportPath}`); }
    add(manifest.symbolSdk.packageName !== '@nemnesia/symbol-sdk' || !manifest.symbolSdk.version || !manifest.symbolSdk.integrity, 'Symbol SDK version or integrity is missing');
    add(!manifest.compatibility.chainCompatibilityVersion || !manifest.compatibility.fixtureContractVersion || !manifest.compatibility.parserVersion, 'compatibility versions are incomplete');
    add(!manifest.targets[platform], `missing ${platform} target metadata`);
    const approvals = manifest.approvals.filter(approval => approval.status === 'approved' && (approval.platform === platform || approval.platform === 'both'));
    (['release', 'security'] as const).forEach(role => add(approvals.filter(item => item.role === role).length < policy.requiredApprovals[role], `insufficient ${role} approvals`));
    if (policy.minimumDistinctApprovers) add(new Set(approvals.map(item => item.approverId)).size < policy.minimumDistinctApprovers, 'insufficient distinct approvers');
    if (policy.allowSameApproverMultipleRoles === false) { const roles = new Map<string, Set<string>>(); approvals.forEach(a => { const value = roles.get(a.approverId) ?? new Set(); value.add(a.role); roles.set(a.approverId, value); }); add([...roles.values()].some(roles => roles.size > 1), 'one approver holds multiple required roles'); }
    const key = policy.trustedKeys[manifest.signature.keyId];
    add(manifest.signature.algorithm !== 'Ed25519' || !key, 'unknown manifest signature key or algorithm');
    if (key && options.signature) { const publicKey = await crypto.subtle.importKey('spki', bufferSource(Uint8Array.from(atob(key), c => c.charCodeAt(0))), { name: 'Ed25519' }, false, ['verify']); add(!(await crypto.subtle.verify('Ed25519', publicKey, bufferSource(options.signature), bufferSource(encoder.encode(manifestSigningPayload(manifest))))), 'manifest signature verification failed'); }
    else add(!options.signature, 'manifest signature is missing');
    const manifestDigest = await sha256(canonicalize(manifest));
    return { platform, enabled: reasons.length === 0, reasons, manifestDigest, evaluatedAt: new Date(now).toISOString() };
  } catch (error) {
    return { platform, enabled: false, reasons: [...reasons, `evaluation error: ${error instanceof Error ? error.message : 'unknown error'}`], evaluatedAt: new Date(now).toISOString() };
  }
};
