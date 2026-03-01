import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

interface GithubActionData {
  version: string;
  hash?: string;
}

async function main() {
  // Update GitHub Actions hashes
  const githubActionsPath = path.join(__dirname, '../src/github/github-actions.json');
  const githubActions = JSON.parse(readFileSync(githubActionsPath, 'utf8')) as Record<string, GithubActionData>;

  for (const [action, data] of Object.entries(githubActions)) {
    const version = data.version;
    console.log(`Refreshing hash for ${action}@${version}`);
    try {
      const output = execSync(`git ls-remote https://github.com/${action} ${version}`).toString();
      const hash = output.split('\t')[0];
      if (hash) {
        data.hash = hash;
        console.log(`  New hash: ${hash}`);
      }
    } catch (e) {
      console.error(`  Failed to fetch hash for ${action}@${version}`);
    }
  }
  writeFileSync(githubActionsPath, JSON.stringify(githubActions, null, 2) + '\n');

  // Update NCU
  const ncuPath = path.join(__dirname, '../src/github/ncu.json');
  const ncu = JSON.parse(readFileSync(ncuPath, 'utf8'));
  console.log('Refreshing NCU version');
  try {
    const latestNcu = execSync('npm show npm-check-updates version').toString().trim();
    ncu.version = latestNcu.split('.')[0];
    console.log(`  New NCU version: ${ncu.version}`);
  } catch (e) {
    console.error('  Failed to fetch NCU version');
  }
  writeFileSync(ncuPath, JSON.stringify(ncu, null, 2) + '\n');

  // Update dd-trace
  const ddTracePath = path.join(__dirname, '../src/github/dd-trace.json');
  const ddTrace = JSON.parse(readFileSync(ddTracePath, 'utf8'));
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

main().catch(console.error);
