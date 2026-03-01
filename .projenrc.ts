import { GithubCredentials, GithubWorkflow, WorkflowActions, WorkflowJobs } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { TypescriptLibraryProject, WorkflowActionsX } from './src';

const project = new TypescriptLibraryProject({
  name: 'projen-extensions',
  packageName: '@gplassard/projen-extensions',
  devDeps: ['projen', 'constructs'],
  peerDeps: ['projen', 'constructs'],
  releaseRank: 1,
  npmIgnoreOptions: {
    ignorePatterns: ['.datadog', '.junie', '*.sh', 'node_modules'],
  },
});
project.tsconfigDev.addInclude('scripts/**/*.ts');
project.deps.removeDependency('@gplassard/projen-extensions');
const upgradeNodeAndPnpmWorkflow = new GithubWorkflow(project.github!, 'upgrade-node-and-pnpm', {});
upgradeNodeAndPnpmWorkflow.on({
  workflowDispatch: {},
  schedule: [{
    cron: '0 0 1 * *',
  }],
});
upgradeNodeAndPnpmWorkflow.addJob('upgrade', {
  name: 'Upgrade',
  runsOn: ['ubuntu-latest'],
  outputs: {
    patch_created: {
      outputName: 'patch_created',
      stepId: 'create_patch',
    },
  },
  permissions: {
    contents: JobPermission.READ,
    packages: JobPermission.READ,
  },
  steps: [
    WorkflowActionsX.checkout({}),
    WorkflowActionsX.setupPnpm({}),
    WorkflowActionsX.setupNode({}),
    WorkflowActionsX.installDependencies({}),
    {
      name: 'Get latest NodeJS versions',
      run: 'gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/nodejs/node/releases --jq \'{"node20": (map(select(.tag_name | startswith("v20."))) | sort_by(.tag_name) | reverse | map({version: .tag_name})[0]), "node22": (map(select(.tag_name | startswith("v22."))) | sort_by(.tag_name) | reverse | map({version: .tag_name})[0]), "node24": (map(select(.tag_name | startswith("v24."))) | sort_by(.tag_name) | reverse | map({version: .tag_name})[0])}\' > src/github/nodejs.json',
      env: {
        GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    },
    {
      name: 'Get latest PNPM',
      run: 'gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/pnpm/pnpm/releases --jq \'map({version: .tag_name})[0]\' > src/github/pnpm.json',
      env: {
        GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    },
    {
      name: 'Upgrade GitHub Actions and NCU',
      run: 'npx ts-node -P tsconfig.dev.json scripts/upgrade-github-versions.ts',
      env: {
        GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    },
    {
      name: 'Upgrade Go and golangci-lint',
      run: 'npx ts-node -P tsconfig.dev.json scripts/upgrade-go-versions.ts',
      env: {
        GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    },
    ...WorkflowActions.uploadGitPatch({
      stepId: 'create_patch',
      outputName: 'patch_created',
    }),
  ],
});
upgradeNodeAndPnpmWorkflow.addJob('pr', {
  ...WorkflowJobs.pullRequestFromPatch( {
    credentials: GithubCredentials.fromApp(),
    patch: {
      jobId: 'upgrade',
      outputName: 'patch_created',
    },
    workflowName: 'upgrade-node-and-pnpm',
    pullRequestTitle: 'chore(deps): upgrade NodeJS, PNPM and other versions',
    labels: ['dependencies'],
    pullRequestDescription: [
      'Upgrades NodeJS (latest versions for Node.js 20, 22, and 24), PNPM, GitHub Actions hashes and other tool versions.',
    ].join('\n\n'),
  }),
  permissions: {
    contents: JobPermission.WRITE,
    pullRequests: JobPermission.WRITE,
  },
});
project.synth();
