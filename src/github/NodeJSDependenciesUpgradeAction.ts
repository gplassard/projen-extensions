import { Component } from 'projen';
import { GithubCredentials, GithubWorkflow, GitHub, WorkflowActions, WorkflowJobs } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from './WorkflowActionsX';
import { ncuVersion } from './utils';

export interface NodeJSDependenciesUpgradeActionProps {

}

export class NodeJSDependenciesUpgradeAction extends Component {
  constructor(scope: GitHub, _props: NodeJSDependenciesUpgradeActionProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'Upgrade-NodeJS-dependencies');
    workflow.on({
      workflowDispatch: {},
      schedule: [
        { cron: '0 0 3 * *' },
      ],
    });
    workflow.addJob('upgrade', {
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
        packages: JobPermission.READ,
      },
      outputs: {
        patch_created: {
          stepId: 'create_patch',
          outputName: 'patch_created',
        },
      },
      steps: [
        WorkflowActionsX.checkout({}),
        WorkflowActionsX.setupPnpm({}),
        WorkflowActionsX.setupNode({ packageManager: 'pnpm' }),
        WorkflowActionsX.installDependencies({}),
        {
          name: 'Upgrade dependencies',
          run: `pnpm dlx npm-check-updates@${ncuVersion()} --upgrade --target=latest`,
          env: {
            NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
          },
        },
        WorkflowActionsX.installDependencies({ noFrozenLockfile: true }),
        {
          name: 'Run projen',
          run: 'pnpm run projen',
        },
        ...WorkflowActions.uploadGitPatch({
          stepId: 'create_patch',
          outputName: 'patch_created',
        }),
      ],
    });
    workflow.addJob('pr', WorkflowJobs.pullRequestFromPatch({
      workflowName: 'upgrade-nodejs-dependencies',
      credentials: GithubCredentials.fromApp(),
      patch: {
        jobId: 'upgrade',
        outputName: 'patch_created',
      },
      pullRequestTitle: 'chore(deps): upgrade dependencies',
      labels: ['dependencies'],
      pullRequestDescription: [
        'Upgrades project dependencies.',
      ].join('\n\n'),
    }));
  }
}
