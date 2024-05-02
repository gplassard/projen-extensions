import { PullRequestLintOptions } from 'projen/lib/github';
import { version as nodeJsVersion } from './nodejs.json';

const DEFAULT_NODE_VERSION: string = nodeJsVersion.replace('v', '');

export const DEFAULT_PULL_REQUEST_LINT_OPTIONS: PullRequestLintOptions = {
  semanticTitleOptions: {
    types: ['feat', 'fix', 'chore', 'refactor', 'build', 'docs', 'ci', 'perf', 'style', 'test'],
    requireScope: true,
  },
};

export const CHECKOUT_STEP = {
  uses: 'actions/checkout@v3',
  with: {
    'fetch-depth': 0,
  },
};


export function setupNode(options: { nodeVersion?: string; packageManager?: string }) {
  return {
    uses: 'actions/setup-node@v3',
    with: {
      'node-version': nodeVersion(options),
      'registry-url': 'https://npm.pkg.github.com',
      'cache': options.packageManager ?? 'pnpm',
    },
  };
}

export function nodeVersion(options: { nodeVersion?: string; packageManager?: string }): string {
  return options.nodeVersion ?? DEFAULT_NODE_VERSION;
}
