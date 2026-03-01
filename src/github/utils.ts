import { PullRequestLintOptions } from 'projen/lib/github';
import ddTraceDefaultVersionJson from './dd-trace.json';
import githubActionsVersions from './github-actions.json';
import ncuDefaultVersionJson from './ncu.json';
import nodeJsVersions from './nodejs.json';
import pnpmDefaultVersionJson from './pnpm.json';


export const NODEJS_VERSIONS = {
  NODEJS_20_X: nodeJsVersions.node20.version.replace('v', ''),
  NODEJS_22_X: nodeJsVersions.node22.version.replace('v', ''),
  NODEJS_24_X: nodeJsVersions.node24.version.replace('v', ''),
};

const DEFAULT_NODE_VERSION: string = NODEJS_VERSIONS.NODEJS_24_X;

const DEFAULT_PNPM_VERSION: string = pnpmDefaultVersionJson.version.replace('v', '');

const DEFAULT_DD_TRACE_VERSION: string = ddTraceDefaultVersionJson.version;

const DEFAULT_NCU_VERSION: string = ncuDefaultVersionJson.version;

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

export type GithubActionName = keyof typeof githubActionsVersions;

export function githubAction(name: GithubActionName): string {
  const action = githubActionsVersions[name];
  if ('hash' in action && action.hash) {
    return `${name}@${action.hash}`;
  }
  return `${name}@${action.version}`;
}

export function ddTraceVersion(options: { ddTraceVersion?: string }): string {
  return options?.ddTraceVersion ?? DEFAULT_DD_TRACE_VERSION;
}

export function ncuVersion(): string {
  return DEFAULT_NCU_VERSION;
}
