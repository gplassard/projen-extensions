import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const HELM_CHARTS = [
  { key: 'cert-manager', repo: 'cert-manager/cert-manager' },
  { key: 'dd-helm-operator', repo: 'DataDog/datadog-operator' },
  { key: 'tailscale-operator', repo: 'tailscale/tailscale' },
];

function fetchLatestVersion(repo: string): string | undefined {
  try {
    const output = execSync(
      `gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/${repo}/releases --jq 'map(select(.prerelease == false)) | map({version: .tag_name})[0]'`,
    ).toString().trim();
    const parsed = JSON.parse(output);
    return parsed.version;
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
    const latest = fetchLatestVersion(chart.repo);
    if (latest) {
      helmCharts[chart.key] = latest;
      console.log(`  New ${chart.key} version: ${latest}`);
    }
  }

  writeFileSync(helmChartsPath, JSON.stringify(helmCharts, null, 2) + '\n');
}

main();
