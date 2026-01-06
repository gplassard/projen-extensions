import { Component } from 'projen';
import { GitHub, GithubWorkflow, WorkflowActions, GithubCredentials } from 'projen/lib/github';
import { AppPermission, JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from '../github';
import { GO_TEST, goBuild, goCaches } from './utils';

export interface GoBuildWorkflowProps {
  readonly goVersion?: string;
}
export class GoBuildWorkflow extends Component {

  constructor(scope: GitHub, props?: GoBuildWorkflowProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'build');
    workflow.on({
      push: {
        branches: ['main'],
      },
      pullRequest: {
        types: ['opened', 'edited', 'synchronize', 'reopened'],
        branches: ['main'],
      },
    });
    workflow.addJob('build', {
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.WRITE,
      },
      outputs: {
        patch_created: {
          stepId: 'create_patch',
          outputName: 'patch_created',
        },
      },
      steps: [
        WorkflowActionsX.checkout({}),
        ...goCaches(props),
        {
          name: 'Format Code',
          run: 'go fmt ./...',
        },
        ...WorkflowActions.uploadGitPatch({
          stepId: 'create_patch',
          outputName: 'patch_created',
        }),
        goBuild(),
        GO_TEST,
        {
          name: 'Fail build on mutation',
          if: 'steps.create_patch.outputs.patch_created',
          run: [
            'echo "::error::Files were changed during build (see build log). If this was triggered from a fork, you will need to update your branch."',
            'cat repo.patch',
            'exit 1',
          ].join('\n'),
        },
      ],
    });

    workflow.addJob('self-mutation', {
      needs: ['build'],
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.WRITE,
      },
      if: 'always() && needs.build.outputs.patch_created && !(github.event.pull_request.head.repo.full_name != github.repository)',
      steps: [
        ...GithubCredentials.fromApp({
          permissions: {
            pullRequests: AppPermission.WRITE,
            contents: AppPermission.WRITE,
          },
        }).setupSteps,
        ...WorkflowActions.checkoutWithPatch({
          token: '${{ steps.generate_token.outputs.token }}',
          ref: '${{ github.event.pull_request.head.ref }}',
          repository: '${{ github.event.pull_request.head.repo.full_name }}',
        }),
        {
          name: 'Set git identity',
          run: [
            'git config user.name "github-actions"',
            'git config user.email "github-actions@github.com"',
          ].join('\n'),
        },
        {
          name: 'Push changes',
          env: {
            PULL_REQUEST_REF: '${{ github.event.pull_request.head.ref }}',
          },
          run: [
            'git add .',
            'git commit -s -m "chore: self mutation"',
            'git push origin HEAD:$PULL_REQUEST_REF',
          ].join('\n'),
        },
      ],
    });
  }
}
