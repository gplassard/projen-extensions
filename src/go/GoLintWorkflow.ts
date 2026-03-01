import { Component } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX, githubAction } from '../github';
import { goCaches, golangciLintVersion } from './utils';

export interface GoLintWorkflowProps {
  readonly goVersion?: string;
  readonly golangciLintVersion?: string;
}

export class GoLintWorkflow extends Component {

  constructor(scope: GitHub, props?: GoLintWorkflowProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'lint');
    workflow.on({
      push: {
        branches: ['main'],
      },
      pullRequest: {
        types: ['opened', 'edited', 'synchronize', 'reopened'],
        branches: ['main'],
      },
    });
    workflow.addJob('lint', {
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
      },
      steps: [
        WorkflowActionsX.checkout({}),
        ...goCaches(props),
        {
          name: 'Run golangci-lint',
          uses: githubAction('golangci/golangci-lint-action'),
          with: {
            version: golangciLintVersion(props),
          },
        },
      ],
    });
  }
}
