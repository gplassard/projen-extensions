import { PullRequestLintOptions } from 'projen/lib/github';
import { version as nodeJsVersion } from './nodejs.json';
import { version as pnpmVersion } from './pnpm.json';

const DEFAULT_NODE_VERSION: string = nodeJsVersion.replace('v', '');
const DEFAULT_PNPM_VERSION: string = pnpmVersion.replace('v', '');

export const DEFAULT_PULL_REQUEST_LINT_OPTIONS: PullRequestLintOptions = {
  semanticTitleOptions: {
    types: ['feat', 'fix', 'chore', 'refactor', 'build', 'docs', 'ci', 'perf', 'style', 'test'],
    requireScope: true,
  },
};

export function nodeVersion(options: { nodeVersion?: string; packageManager?: string }): string {
  return options.nodeVersion ?? DEFAULT_NODE_VERSION;
}

export function pnpmVersion(): string {
  return DEFAULT_PNPM_VERSION;
}