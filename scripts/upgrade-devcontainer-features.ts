import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const GHCR_PREFIX = 'ghcr.io/';

interface LockfileFeature {
  version: string;
  resolved: string;
  integrity: string;
}

interface PackageVersion {
  name: string;
  metadata?: { container?: { tags?: string[] } };
}

function fetchPackageVersions(feature: string): PackageVersion[] {
  const [owner, ...rest] = feature.slice(GHCR_PREFIX.length).split('/');
  const packageName = encodeURIComponent(rest.join('/'));
  for (const kind of ['orgs', 'users']) {
    try {
      const output = execSync(
        `gh api --paginate "/${kind}/${owner}/packages/container/${packageName}/versions?per_page=100"`,
        { maxBuffer: 64 * 1024 * 1024 },
      ).toString();
      return JSON.parse(`[${output.replace(/\]\s*\[/g, '],[')}]`).flat() as PackageVersion[];
    } catch (e) {
      console.error(`  Failed to fetch package versions from ${kind}/${owner}`);
    }
  }
  return [];
}

function parseSemver(tag: string): number[] | undefined {
  return /^\d+\.\d+\.\d+$/.test(tag) ? tag.split('.').map(Number) : undefined;
}

function compareSemver(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function main() {
  const featuresPath = path.join(__dirname, '../src/devcontainer/devcontainer-features.json');
  const features = JSON.parse(readFileSync(featuresPath, 'utf8')) as Record<string, LockfileFeature>;

  for (const [featureId, data] of Object.entries(features)) {
    const separator = featureId.lastIndexOf(':');
    const feature = featureId.slice(0, separator);
    const major = featureId.slice(separator + 1);
    console.log(`Refreshing ${featureId}`);
    const candidates = fetchPackageVersions(feature)
      .flatMap(v => (v.metadata?.container?.tags ?? [])
        .map(parseSemver)
        .filter((semver): semver is number[] => semver !== undefined && String(semver[0]) === major)
        .map(semver => ({ semver, digest: v.name })))
      .sort((a, b) => compareSemver(a.semver, b.semver));
    const latest = candidates[candidates.length - 1];
    if (latest) {
      data.version = latest.semver.join('.');
      data.resolved = `${feature}@${latest.digest}`;
      data.integrity = latest.digest;
      console.log(`  New version ${data.version}: ${latest.digest}`);
    } else {
      console.error('  No version found, keeping the current lock entry');
    }
  }
  writeFileSync(featuresPath, JSON.stringify(features, null, 2) + '\n');
}

main();
