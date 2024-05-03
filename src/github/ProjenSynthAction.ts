import { IConstruct } from 'constructs';
import { Component, Project, YamlFile } from 'projen';
import { WorkflowActions, GithubCredentials, workflows } from 'projen/lib/github';
import { AppPermission, JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface ProjenSynthActionProps {

}

export class ProjenSynthAction extends Component {
  constructor(scope: IConstruct, _props: ProjenSynthActionProps) {
    super(scope);
    new YamlFile(Project.of(scope).root, '.github/workflows/projen-synth.yml', {
      obj: {
        name: 'Projen Synth',
        on: {
          push: {
            branches: 'main',
          },
          pull_request: {},
        },
        jobs: {
          'build': {
            'runs-on': 'ubuntu-latest',
            'permissions': {
              contents: 'read',
              packages: 'read',
            },
            'outputs': {
              self_mutation_happened: '${{ steps.self_mutation.outputs.self_mutation_happened }}',
            },
            'env': {
              CI: 'true',
            },
            'steps': [
              WorkflowActionsX.checkout({}),
              WorkflowActionsX.setupPnpm({}),
              WorkflowActionsX.setupNode({ packageManager: 'pnpm' }),
              WorkflowActionsX.installDependencies({}),
              {
                name: 'Run projen',
                run: 'pnpm run projen',
              },
              ...WorkflowActions.uploadGitPatch({
                stepId: 'self_mutation',
                outputName: 'self_mutation_happened',
              }),
              {
                name: 'Fail build on mutation',
                if: 'steps.self_mutation.outputs.self_mutation_happened',
                run: [
                  'echo "::error::Files were changed during build (see build log). If this was triggered from a fork, you will need to update your branch."',
                  'cat .repo.patch',
                  'exit 1',
                ].join('\n'),
              },
            ],
          },
          'self-mutation': {
            'needs': 'build',
            'runs-on': 'ubuntu-latest',
            'permissions': {
              contents: 'write',
            },
            'if': 'always() && needs.build.outputs.self_mutation_happened && !(github.event.pull_request.head.repo.full_name != github.repository)',
            'steps': [
              ...GithubCredentials.fromApp({
                permissions: {
                  pullRequests: AppPermission.WRITE,
                  contents: AppPermission.WRITE,
                  workflows: AppPermission.WRITE,
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
          },
        },
      },
    });
  }
}
