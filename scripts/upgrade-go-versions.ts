import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

async function main() {
  // Update Go version
  const goPath = path.join(__dirname, '../src/go/go.json');
  const go = JSON.parse(readFileSync(goPath, 'utf8')) as { version: string, pinned?: boolean };
  if (go.pinned) {
    console.log('Skipping pinned Go version');
  } else {
    console.log('Refreshing Go version');
    try {
      const latestGo = execSync('gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/golang/go/tags --jq ".[].name"').toString().trim().split('\n').filter(name => name.startsWith('go')).map(name => name.replace('go', ''))[0];
      if (latestGo) {
        go.version = latestGo.split('.').slice(0, 2).join('.');
        console.log(`  New Go version: ${go.version}`);
      }
    } catch (e) {
      console.error('  Failed to fetch Go version');
    }
    writeFileSync(goPath, JSON.stringify(go, null, 2) + '\n');
  }

  // Update golangci-lint version
  const golangciLintPath = path.join(__dirname, '../src/go/golangci-lint.json');
  const golangciLint = JSON.parse(readFileSync(golangciLintPath, 'utf8')) as { version: string, pinned?: boolean };
  if (golangciLint.pinned) {
    console.log('Skipping pinned golangci-lint version');
  } else {
    console.log('Refreshing golangci-lint version');
    try {
      const latestGolangciLint = execSync('gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/golangci/golangci-lint/releases --jq ".[].tag_name"').toString().trim().split('\n')[0];
      if (latestGolangciLint) {
        golangciLint.version = latestGolangciLint;
        console.log(`  New golangci-lint version: ${golangciLint.version}`);
      }
    } catch (e) {
      console.error('  Failed to fetch golangci-lint version');
    }
    writeFileSync(golangciLintPath, JSON.stringify(golangciLint, null, 2) + '\n');
  }
}

main().catch(console.error);
