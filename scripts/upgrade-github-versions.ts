import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

interface GithubActionData {
  version: string;
  hash?: string;
  pinned?: boolean;
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
      const latestNcu = execSync('npm show npm-check-updates version').toString().trim();
      ncu.version = latestNcu.split('.')[0];
      console.log(`  New NCU version: ${ncu.version}`);
    } catch (e) {
      console.error('  Failed to fetch NCU version');
    }
    writeFileSync(ncuPath, JSON.stringify(ncu, null, 2) + '\n');
  }

  // Update dd-trace
  const ddTracePath = path.join(__dirname, '../src/github/dd-trace.json');
  const ddTrace = JSON.parse(readFileSync(ddTracePath, 'utf8'));
  if (ddTrace.pinned) {
    console.log('Skipping pinned dd-trace version');
  } else {
    console.log('Refreshing dd-trace version');
    try {
      const latestDdTrace = execSync('npm show dd-trace version').toString().trim();
      ddTrace.version = latestDdTrace;
      console.log(`  New dd-trace version: ${ddTrace.version}`);
    } catch (e) {
      console.error('  Failed to fetch dd-trace version');
    }
    writeFileSync(ddTracePath, JSON.stringify(ddTrace, null, 2) + '\n');
  }

  // Update datadog-operator
  const ddOperatorPath = path.join(__dirname, '../src/github/datadog-operator.json');
  const ddOperator = JSON.parse(readFileSync(ddOperatorPath, 'utf8'));
  if (ddOperator.pinned) {
    console.log('Skipping pinned datadog-operator version');
  } else {
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
      const latest = tags[tags.length - 1];
      if (latest) {
        ddOperator.version = latest;
        console.log(`  New datadog-operator version: ${ddOperator.version}`);
      }
    } catch (e) {
      console.error('  Failed to fetch datadog-operator version');
    }
    writeFileSync(ddOperatorPath, JSON.stringify(ddOperator, null, 2) + '\n');
  }
}

main().catch(console.error);
