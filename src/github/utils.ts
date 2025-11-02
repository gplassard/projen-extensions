import { PullRequestLintOptions } from 'projen/lib/github';
import { version as ddTraceDefaultVersion } from './dd-trace.json';
import * as nodeJsVersions from './nodejs.json';
import { version as pnpmDefaultVersion } from './pnpm.json';


export const NODEJS_VERSIONS = {
  NODEJS_20_X: nodeJsVersions.node20.version.replace('v', ''),
  NODEJS_22_X: nodeJsVersions.node22.version.replace('v', ''),
  NODEJS_24_X: nodeJsVersions.node24.version.replace('v', ''),
};

const DEFAULT_NODE_VERSION: string = NODEJS_VERSIONS.NODEJS_22_X; // LTS

const DEFAULT_PNPM_VERSION: string = pnpmDefaultVersion.replace('v', '');

const DEFAULT_DD_TRACE_VERSION: string = ddTraceDefaultVersion;

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

export function ddTraceVersion(options: { ddTraceVersion?: string }): string {
  return options?.ddTraceVersion ?? DEFAULT_DD_TRACE_VERSION;
}
