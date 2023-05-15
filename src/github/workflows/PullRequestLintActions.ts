import { Component, Project, YamlFile } from 'projen';

export interface PullRequestLintActionsProps {

}
export class PullRequestLintActions extends Component {
  constructor(project: Project, _props?: PullRequestLintActionsProps) {
    super(project);

    new YamlFile(project, '.github/workflows/pull-request-lint.yml', {
      obj: {
        name: 'pull-request-lint',
        on: {
          pull_request: {
            types: ['opened', 'synchronize', 'edited'],
          },
        },
        jobs: {
          validate: {
            'name': 'Validate PR title',
            'runs-on': 'ubuntu-latest',
            'permissions': {
              'pull-requests': 'write',
            },
            'steps': [{
              uses: 'amannn/action-semantic-pull-request@v5.2.0',
              env: {
                GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
              },
              with: {
                types: ['feat', 'fix', 'chore'].join('\n'),
                requireScope: false,
              },
            }],
          },
        },
      },
    });
  }
}
