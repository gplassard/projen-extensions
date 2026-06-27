import { Component } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { githubAction } from './utils';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface DeployGithubPagesWorkflowOptions {
  buildCommand?: string;
  artifactPath?: string;
}

export class DeployGithubPagesWorkflow extends Component {
  constructor(scope: GitHub, options: DeployGithubPagesWorkflowOptions) {
    super(scope, 'deploy-github-pages-workflow');


    const workflow = new GithubWorkflow(scope, 'deploy-website', {
      limitConcurrency: true,
      concurrencyOptions: {
        group: 'deploy-website',
        cancelInProgress: false,
      },
    });
    workflow.on({
      push: {
        branches: ['main'],
      },
      workflowDispatch: {},
    });
    workflow.addJob('deploy', {
      name: 'deploy',
      environment: {
        name: 'github-pages',
        url: '${{ steps.deployment.outputs.deployment_url }}',
      },
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
        packages: JobPermission.READ,
        pages: JobPermission.WRITE,
        idToken: JobPermission.WRITE,
      },
      steps: [
        WorkflowActionsX.checkout({}),
        WorkflowActionsX.setupPnpm({}),
        WorkflowActionsX.setupNode({}),
        WorkflowActionsX.installDependencies({}),
        {
          name: 'Build',
          run: options.buildCommand ?? 'pnpm run build',
        },
        {
          name: 'Setup pages',
          uses: githubAction('actions/configure-pages'),
        },
        {
          name: 'Upload artifact',
          uses: githubAction('actions/upload-pages-artifact'),
          with: {
            path: options.artifactPath ?? './dist',
          },
        },
        {
          name: 'Deploy to Github Pages',
          uses: githubAction('actions/deploy-pages'),
        },
      ],
    });

  }
}
