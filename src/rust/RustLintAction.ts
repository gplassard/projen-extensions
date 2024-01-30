import { Component, Project, YamlFile } from 'projen';

export interface RustLintActionProps {

}
export class RustLintAction extends Component {

  constructor(project: Project, _props?: RustLintActionProps) {
    super(project);

    new YamlFile(project, '.github/workflows/rust-lint.yml', {
      obj: {
        name: 'lint',
        on: {
          push: {
            branches: ['main'],
          },
          pull_request: {
            types: ['opened', 'edited', 'synchronize', 'reopened'],
            branches: ['main'],
          },
        },
        env: {
          RUSTFLAGS: '-Dwarnings',
        },
        jobs: {
          'lint-rust': {
            'runs-on': 'ubuntu-latest',
            'steps': [
              {
                name: 'Generate token',
                id: 'generate-token',
                uses: 'tibdex/github-app-token@021a2405c7f990db57f5eae5397423dcc554159c',
                with: {
                  app_id: '${{ secrets.PROJEN_APP_ID }}',
                  private_key: '${{ secrets.PROJEN_APP_PRIVATE_KEY }}',
                  permissions: '{"pull_requests":"write","contents":"write"}',
                },
              },
              {
                uses: 'actions/checkout@v3',
                with: {
                  ref: '${{ github.event.pull_request.head.ref }}',
                  token: '${{ steps.generate-token.outputs.token }}',
                },
              },
              {
                name: 'Run Clippy',
                run: 'cargo clippy --all-targets --all-features',
              },
              {
                name: 'Format Code',
                run: 'cargo fmt',
              },
              {
                name: 'Commit changes',
                uses: 'EndBug/add-and-commit@v9',
                with: {
                  author_name: 'github-actions',
                  author_email: 'github-actions@github.com',
                  message: 'style(formatting): self mutation',
                },
              },
            ],
          },
        },
      },
    });
  }
}
