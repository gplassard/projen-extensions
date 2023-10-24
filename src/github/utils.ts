import { PullRequestLintOptions } from 'projen/lib/github';

export const DEFAULT_PULL_REQUEST_LINT_OPTIONS: PullRequestLintOptions = {
        semanticTitleOptions: {
            types: ['feat', 'fix', 'chore', 'refactor', 'build', 'docs', 'ci', 'perf', 'style', 'test'],
            requireScope: true,
        },
}
