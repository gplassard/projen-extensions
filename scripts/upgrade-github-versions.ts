import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

interface GithubActionData {
  version: string;
  hash?: string;
  pinned?: boolean;
}

const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function isOldEnough(date: string | Date): boolean {
  return Date.now() - new Date(date).getTime() >= COOLDOWN_MS;
}

/** Date of the commit a git ref (sha, tag, branch) of a GitHub repository points to. */
function fetchCommitDate(repo: string, ref: string): string {
  return execSync(
    `gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/${repo}/commits/${encodeURIComponent(ref)} --jq ".commit.committer.date"`,
  ).toString().trim();
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Highest stable version of an npm package published at least COOLDOWN_DAYS ago. */
function fetchLatestNpmVersionWithCooldown(packageName: string): string | undefined {
  const times = JSON.parse(execSync(`npm view ${packageName} time --json`).toString()) as Record<string, string>;
  const candidates = Object.entries(times)
    .filter(([version]) => /^\d+\.\d+\.\d+$/.test(version))
    .filter(([, date]) => isOldEnough(date))
    // Sort by version, not by date: maintenance releases of older majors can be published after newer majors.
    .sort(([a], [b]) => compareVersions(a, b));
  return candidates[candidates.length - 1]?.[0];
}

/**
 * For a floating tag (e.g. v4) that moved less than COOLDOWN_DAYS ago, finds the newest more specific tag
 * (e.g. v4.2.1) that is old enough, so the action can still be updated instead of staying stale.
 */
function findOldEnoughHashForFloatingTag(repo: string, version: string): { tag: string, hash: string } | undefined {
  const output = execSync(`git ls-remote --tags https://github.com/${repo} "refs/tags/${version}.*"`).toString();
  const hashes = new Map<string, string>();
  for (const line of output.split('\n')) {
    const [sha, ref] = line.split('\t');
    if (!sha || !ref) continue;
    const name = ref.replace('refs/tags/', '');
    const tag = name.replace('^{}', '');
    if (!/^v?\d+(\.\d+)+$/.test(tag)) continue;
    // Peeled entries (^{}) point to the commit of annotated tags, prefer them.
    if (name.endsWith('^{}') || !hashes.has(tag)) hashes.set(tag, sha);
  }
  const tags = [...hashes.keys()].sort((a, b) => compareVersions(b, a));
  for (const tag of tags) {
    if (isOldEnough(fetchCommitDate(repo, tag))) {
      return { tag, hash: hashes.get(tag)! };
    }
  }
  return undefined;
}

async function main() {
  // Update GitHub Actions hashes
  const githubActionsPath = path.join(__dirname, '../src/github/github-actions.json');
  const githubActions = JSON.parse(readFileSync(githubActionsPath, 'utf8')) as Record<string, GithubActionData>;

  for (const [action, data] of Object.entries(githubActions)) {
    if (data.pinned) {
      console.log(`Skipping pinned action ${action}`);
      continue;
    }
    const version = data.version;
    console.log(`Refreshing hash for ${action}@${version}`);
    try {
      const output = execSync(`git ls-remote https://github.com/${action} ${version}`).toString();
      const hash = output.split('\t')[0];
      if (hash) {
        // Only apply the cooldown when replacing an existing hash: with no hash yet there is nothing to keep.
        if (data.hash && hash !== data.hash) {
          // Resolve the date from the version ref rather than the ls-remote hash, which may be an annotated tag object.
          const commitDate = fetchCommitDate(action, version);
          if (!isOldEnough(commitDate)) {
            console.log(`  Hash ${hash} is from ${commitDate}, less than ${COOLDOWN_DAYS} days old`);
            const fallback = findOldEnoughHashForFloatingTag(action, version);
            if (fallback && fallback.hash !== data.hash) {
              data.hash = fallback.hash;
              console.log(`  Using older release ${fallback.tag}: ${fallback.hash}`);
            } else {
              console.log('  No older release found, keeping current hash');
            }
            continue;
          }
        }
        data.hash = hash;
        console.log(`  New hash: ${hash}`);
      } else {
        delete data.hash;
        console.log('  No hash found, removing hash');
      }
    } catch (e) {
      console.error(`  Failed to fetch hash for ${action}@${version}`);
    }
  }
  writeFileSync(githubActionsPath, JSON.stringify(githubActions, null, 2) + '\n');

  // Update NCU
  const ncuPath = path.join(__dirname, '../src/github/ncu.json');
  const ncu = JSON.parse(readFileSync(ncuPath, 'utf8'));
  if (ncu.pinned) {
    console.log('Skipping pinned NCU version');
  } else {
    console.log('Refreshing NCU version');
    try {
      const latestNcu = fetchLatestNpmVersionWithCooldown('npm-check-updates');
      if (latestNcu) {
        ncu.version = latestNcu.split('.')[0];
        console.log(`  New NCU version: ${ncu.version}`);
      } else {
        console.log(`  No NCU version older than ${COOLDOWN_DAYS} days found, keeping current version`);
      }
    } catch (e) {
      console.error('  Failed to fetch NCU version');
    }
    writeFileSync(ncuPath, JSON.stringify(ncu, null, 2) + '\n');
  }

  // Update datadog (dd-trace and helm-operator)
  const datadogPath = path.join(__dirname, '../src/github/datadog.json');
  const datadog = JSON.parse(readFileSync(datadogPath, 'utf8'));

  if (datadog.pinned) {
    console.log('Skipping pinned datadog versions');
  } else {
    // Update dd-trace-js
    console.log('Refreshing dd-trace version');
    try {
      const latestDdTrace = fetchLatestNpmVersionWithCooldown('dd-trace');
      if (latestDdTrace) {
        datadog['dd-trace-js'] = latestDdTrace;
        console.log(`  New dd-trace version: ${datadog['dd-trace-js']}`);
      } else {
        console.log(`  No dd-trace version older than ${COOLDOWN_DAYS} days found, keeping current version`);
      }
    } catch (e) {
      console.error('  Failed to fetch dd-trace version');
    }

    // Update helm-operator
    console.log('Refreshing datadog-operator version');
    try {
      const lsRemoteOutput = execSync('git ls-remote --tags https://github.com/DataDog/helm-charts').toString();
      const tags = lsRemoteOutput.split('\n')
        .map(line => line.split('refs/tags/')[1])
        .filter(tag => tag && tag.startsWith('datadog-operator-') && !tag.includes('-dev') && !tag.includes('^'))
        .map(tag => tag.replace('datadog-operator-', '').trim());
      tags.sort((a, b) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if (pa[i] > pb[i]) return 1;
          if (pa[i] < pb[i]) return -1;
        }
        return 0;
      });
      let latest: string | undefined;
      for (const tag of [...tags].reverse()) {
        const commitDate = fetchCommitDate('DataDog/helm-charts', `datadog-operator-${tag}`);
        if (isOldEnough(commitDate)) {
          latest = tag;
          break;
        }
        console.log(`  Skipping datadog-operator ${tag} (${commitDate}), less than ${COOLDOWN_DAYS} days old`);
      }
      if (latest) {
        datadog['helm-operator'] = latest;
        console.log(`  New datadog-operator version: ${datadog['helm-operator']}`);
      }
    } catch (e) {
      console.error('  Failed to fetch datadog-operator version');
    }
    writeFileSync(datadogPath, JSON.stringify(datadog, null, 2) + '\n');
  }
}

main().catch(console.error);
