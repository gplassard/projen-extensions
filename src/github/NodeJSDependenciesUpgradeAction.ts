import { IConstruct } from 'constructs';
import { Component, Project, YamlFile } from 'projen';
import { GithubCredentials, WorkflowActions, WorkflowJobs } from 'projen/lib/github';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface NodeJSDependenciesUpgradeActionProps {

}

export class NodeJSDependenciesUpgradeAction extends Component {
  constructor(scope: IConstruct, _props: NodeJSDependenciesUpgradeActionProps) {
    super(scope);

    new YamlFile(Project.of(scope).root, '.github/workflows/upgrade-nodejs-dependencies.yml', {
      obj: {
        name: 'upgrade-nodejs-dependencies',
        on: {
          workflow_dispatch: {},
          schedule: [
            { cron: '0 0 1 * *' },
          ],
        },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            'permissions': {
              contents: 'read',
              packages: 'read',
            },
            'outputs': {
              patch_created: '${{ steps.create_patch.outputs.patch_created }}',
            },
            'steps': [
              WorkflowActionsX.checkout({}),
              WorkflowActionsX.setupPnpm({}),
              WorkflowActionsX.installDependencies({}),
              {
                name: 'Upgrade dependencies',
                run: 'pnpm dlx npm-check-updates@16 --upgrade --target=latest',
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
          },

          pr: WorkflowJobs.pullRequestFromPatch({
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
          }),
        },
      },
    });
  }
}
