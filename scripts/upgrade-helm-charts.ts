import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const HELM_CHARTS = [
  { key: 'cert-manager', repo: 'cert-manager/cert-manager' },
  { key: 'dd-helm-operator', repo: 'DataDog/helm-charts', tagPrefix: 'datadog-operator-' },
  { key: 'tailscale-operator', repo: 'tailscale/tailscale' },
];

function fetchLatestVersion(repo: string, tagPrefix?: string): string | undefined {
  try {
    if (tagPrefix) {
      // For repos that use tags with a prefix (e.g., datadog-operator-2.31.0)
      const output = execSync(
        `gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/${repo}/git/refs/tags --jq '.[].ref'`,
      ).toString().trim();
      const tags = output.split('\n').filter(t => t.includes(tagPrefix));
      // Filter out dev/pre-release tags and sort to find the latest stable version
      const stableTags = tags
        .map(t => t.replace(`refs/tags/${tagPrefix}`, ''))
        .filter(v => !v.includes('-dev') && !v.includes('-rc'));
      if (stableTags.length === 0) {
        return undefined;
      }
      // Sort versions and return the latest
      stableTags.sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
        if (aMajor !== bMajor) return aMajor - bMajor;
        if (aMinor !== bMinor) return aMinor - bMinor;
        return aPatch - bPatch;
      });
      return stableTags[stableTags.length - 1];
    } else {
      const output = execSync(
        `gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/${repo}/releases --jq 'map(select(.prerelease == false)) | map({version: .tag_name})[0]'`,
      ).toString().trim();
      const parsed = JSON.parse(output);
      const version = parsed.version;
      return version.startsWith('v') ? version.slice(1) : version;
    }
  } catch (e) {
    console.error(`  Failed to fetch latest version for ${repo}`);
    return undefined;
  }
}

function main() {
  const helmChartsPath = path.join(__dirname, '../src/github/helm-charts.json');
  const helmCharts = JSON.parse(readFileSync(helmChartsPath, 'utf8')) as Record<string, string>;

  for (const chart of HELM_CHARTS) {
    console.log(`Refreshing ${chart.key} version`);
    const latest = fetchLatestVersion(chart.repo, chart.tagPrefix);
    if (latest) {
      helmCharts[chart.key] = latest;
      console.log(`  New ${chart.key} version: ${latest}`);
    }
  }

  writeFileSync(helmChartsPath, JSON.stringify(helmCharts, null, 2) + '\n');
}

main();
