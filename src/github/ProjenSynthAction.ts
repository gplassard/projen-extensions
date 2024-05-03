import { IConstruct } from 'constructs';
import { Component, Project, YamlFile } from 'projen';
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
            'steps': [
              WorkflowActionsX.checkout({}),
              WorkflowActionsX.setupPnpm({}),
              WorkflowActionsX.setupNode({ packageManager: 'pnpm' }),
              WorkflowActionsX.installDependencies({}),
              {
                name: 'Run projen',
                run: 'pnpm run projen',
              },
              {
                'name': 'Find mutations',
                'id': 'self_mutation',
                'run': [
                  'git add .',
                  'git diff --staged --patch --exit-code > .repo.patch || echo "self_mutation_happened=true" >> $GITHUB_OUTPUT',
                ].join('\n'),
                'working-directory': './',
              },
              {
                name: 'Upload patch',
                if: 'steps.self_mutation.outputs.self_mutation_happened',
                uses: 'actions/upload-artifact@v4',
                with: {
                  name: '.repo.patch',
                  path: '.repo.patch',
                  overwrite: true,
                },
              },
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
              {
                name: 'Generate token',
                id: 'generate_token',
                uses: 'tibdex/github-app-token@3beb63f4bd073e61482598c45c71c1019b59b73a',
                with: {
                  app_id: '${{ secrets.PROJEN_APP_ID }}',
                  private_key: '${{ secrets.PROJEN_APP_PRIVATE_KEY }}',
                  permissions: '{"pull_requests":"write","contents":"write","workflows":"write"}',
                },
              },
              WorkflowActionsX.checkout({
                token: '${{ steps.generate_token.outputs.token }}',
                ref: '${{ github.event.pull_request.head.ref }}',
                repository: '${{ github.event.pull_request.head.repo.full_name }}',
              }),
              {
                name: 'Download patch',
                uses: 'actions/download-artifact@v4',
                with: {
                  name: '.repo.patch',
                  path: '${{ runner.temp }}',
                },
              },
              {
                name: 'Apply patch',
                run: '[ -s ${{ runner.temp }}/.repo.patch ] && git apply ${{ runner.temp }}/.repo.patch || echo "Empty patch. Skipping."',
              },
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
