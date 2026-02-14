import { Component } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from '../github';
import { goCaches, golangciLintVersion } from './utils';

export interface GoLintWorkflowProps {
  readonly goVersion?: string;
  readonly golangciLintVersion?: string;
  readonly workingDirectory?: string;
}

export class GoLintWorkflow extends Component {

  constructor(scope: GitHub, props?: GoLintWorkflowProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, props?.workingDirectory ? `lint-${props.workingDirectory}` : 'lint');
    workflow.on({
      push: {
        branches: ['main'],
      },
      pullRequest: {
        types: ['opened', 'edited', 'synchronize', 'reopened'],
        branches: ['main'],
      },
    });
    const jobId = props?.workingDirectory ? `lint-${props.workingDirectory}` : 'lint';
    workflow.addJob(jobId, {
      name: props?.workingDirectory ? `Lint ${props.workingDirectory}` : 'Lint',
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
      },
      steps: [
        WorkflowActionsX.checkout({}),
        ...goCaches(props),
        {
          name: 'Run golangci-lint',
          uses: 'golangci/golangci-lint-action@v9',
          with: {
            version: golangciLintVersion(props),
            'working-directory': props?.workingDirectory,
          },
        },
      ],
    });
  }
}
