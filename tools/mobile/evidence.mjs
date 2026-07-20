import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, '.artifacts/mobile');
const dist = path.join(root, 'apps/mobile/dist');
await mkdir(output, { recursive: true });

const components = new Map();
const visitedPackages = new Set();
const resolveDependencyJson = async (fromPackageJson, dependencyName) => {
  let searchDirectory = path.dirname(fromPackageJson);
  while (searchDirectory !== path.dirname(searchDirectory)) {
    const candidates = [
      path.join(searchDirectory, 'node_modules', dependencyName, 'package.json'),
      ...(path.basename(searchDirectory) === 'node_modules'
        ? [path.join(searchDirectory, dependencyName, 'package.json')]
        : []),
    ];
    for (const candidate of candidates) {
      try {
        await readFile(candidate, 'utf8');
        return candidate;
      } catch {
        // Try the next Node module lookup location.
      }
    }
    searchDirectory = path.dirname(searchDirectory);
  }

  const require = createRequire(fromPackageJson);
  try {
    return require.resolve(`${dependencyName}/package.json`);
  } catch {
    let directory = path.dirname(require.resolve(dependencyName));
    while (directory !== path.dirname(directory)) {
      const candidate = path.join(directory, 'package.json');
      try {
        const value = JSON.parse(await readFile(candidate, 'utf8'));
        if (value.name === dependencyName) return candidate;
      } catch {
        // Continue toward the package store root.
      }
      directory = path.dirname(directory);
    }
    throw new Error(`Cannot locate package metadata for ${dependencyName}`);
  }
};
const visitPackage = async (packageJsonPath) => {
  const canonicalPath = await realpath(packageJsonPath);
  if (visitedPackages.has(canonicalPath)) return;
  visitedPackages.add(canonicalPath);

  const packageJson = JSON.parse(await readFile(canonicalPath, 'utf8'));
  if (packageJson.name !== '@mosaiclynx/mobile') {
    const version = packageJson.version ?? 'workspace';
    components.set(`${packageJson.name}@${version}`, {
      type: 'library',
      name: packageJson.name,
      version,
      purl: packageJson.name?.startsWith('@mosaiclynx/')
        ? undefined
        : `pkg:npm/${encodeURIComponent(packageJson.name)}@${version}`,
    });
  }

  for (const dependencyName of Object.keys(packageJson.dependencies ?? {})) {
    const dependencyJson = await resolveDependencyJson(canonicalPath, dependencyName);
    await visitPackage(dependencyJson);
  }
};
await visitPackage(path.join(root, 'apps/mobile/package.json'));
const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: { component: { type: 'application', name: 'MosaicLynx Testnet Mobile', version: '0.1.0' } },
  components: [...components.values()]
    .sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`))
    .map(({ purl, ...item }) => (purl ? { ...item, purl } : item)),
};
await writeFile(path.join(output, 'sbom.cdx.json'), `${JSON.stringify(sbom, null, 2)}\n`);

const files = [];
const walk = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else {
      const bytes = await readFile(target);
      files.push({
        path: path.relative(root, target),
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
};
await walk(dist);
files.sort((a, b) => a.path.localeCompare(b.path));
await writeFile(
  path.join(output, 'artifact-digests.json'),
  `${JSON.stringify({ schemaVersion: '1', mainnetEnabled: false, files }, null, 2)}\n`
);
