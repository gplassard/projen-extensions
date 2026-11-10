import { TypescriptLibraryProject, ScheduledUpgradeWorkflow } from './src';

const project = new TypescriptLibraryProject({
  name: 'projen-extensions',
  packageName: '@gplassard/projen-extensions',
  devDeps: ['projen', 'constructs'],
  peerDeps: ['projen', 'constructs'],
  releaseRank: 1,
  agentConfigurationEnabled: true,
  npmIgnoreOptions: {
    ignorePatterns: ['.datadog', '.junie', '*.sh', 'node_modules'],
  },
});
project.tsconfigDev.addInclude('scripts/**/*.ts');
project.deps.removeDependency('@gplassard/projen-extensions');
project.addTask('upgrade-github-versions', {
  description: 'Upgrade GitHub dependencies to latest versions',
  exec: 'tsx scripts/upgrade-github-versions.ts',
});
project.addTask('upgrade-devcontainer-features', {
  description: 'Upgrade devcontainer features to the latest versions',
  exec: 'tsx scripts/upgrade-devcontainer-features.ts',
});
project.addTask('upgrade-go-versions', {
  description: 'Upgrade go dependencies to latest versions',
  exec: 'tsx scripts/upgrade-go-versions.ts',
});

new ScheduledUpgradeWorkflow(project.github!, {
  workflowName: 'upgrade-external-versions',
  cronSchedule: '0 0 1 * *',
  pullRequestTitle: 'chore(deps): upgrade NodeJS, PNPM, devcontainer features and other versions',
  pullRequestDescription: 'Upgrades NodeJS (latest versions for Node.js), PNPM, GitHub Actions hashes, devcontainer features and other tool versions.',
  upgradeSteps: [
    {
      name: 'Get latest NodeJS versions',
      run: 'gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/nodejs/node/releases --jq \'map(select(.prerelease == false)) | {"node26": (map(select(.tag_name | startswith("v26."))) | sort_by(.tag_name) | reverse | map({version: .tag_name})[0]), "node22": (map(select(.tag_name | startswith("v22."))) | sort_by(.tag_name) | reverse | map({version: .tag_name})[0]), "node24": (map(select(.tag_name | startswith("v24."))) | sort_by(.tag_name) | reverse | map({version: .tag_name})[0])}\' > src/github/nodejs.json',
    },
    {
      name: 'Get latest PNPM',
      run: 'gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/pnpm/pnpm/releases --jq \'map(select(.prerelease == false)) | map({version: .tag_name})[0]\' > src/github/pnpm.json',
    },
    {
      name: 'Upgrade GitHub Actions and NCU',
      run: 'pnpm run upgrade-github-versions',
    },
    {
      name: 'Upgrade devcontainer features',
      run: 'pnpm run upgrade-devcontainer-features',
    },
    {
      name: 'Upgrade Go and golangci-lint',
      run: 'pnpm run upgrade-go-versions',
    },
  ],
});
project.synth();
