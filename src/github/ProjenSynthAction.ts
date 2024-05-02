import { IConstruct } from 'constructs';
import { Component, Project, YamlFile } from 'projen';
import { CHECKOUT_STEP, setupNode } from './utils';

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
          build: {
            'runs-on': 'ubuntu-latest',
            'permissions': {
              contents: 'read',
              packages: 'read',
            },
            'steps': [
              CHECKOUT_STEP,
              {
                name: 'Setup pnpm',
                uses: 'pnpm/action-setup@v3',
                with: {
                  version: '9',
                },
              },
              setupNode({ packageManager: 'pnpm' }),
              {
                name: 'Install dependencies',
                run: ' pnpm i --no-frozen-lockfile',
                env: {
                  NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                },
              },
              {
                name: 'Run projen',
                run: ' pnpm run projen',
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
                name: 'Upload match',
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
        },
      },
    });
  }
}
