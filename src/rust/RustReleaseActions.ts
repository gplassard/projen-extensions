import { Component, Project, YamlFile } from 'projen';
import { WorkflowActionsX } from '../github';

export interface RustReleaseActionsProps {

}
export class RustReleaseActions extends Component {

  constructor(project: Project, _props?: RustReleaseActionsProps) {
    super(project);

    const build = {
      name: 'Build',
      run: 'cargo build --release',
    };
    const tests = {
      name: 'Tests',
      run: 'cargo test --verbose',
    };

    new YamlFile(project, '.github/workflows/rust-release.yml', {
      obj: {
        name: 'release',
        on: {
          push: {
            tags: ['v*'],
          },
        },
        env: {
          CARGO_TERM_COLOR: 'always',
        },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            'steps': [
              WorkflowActionsX.checkout({}),
              build,
              tests,
              {
                name: 'Create release',
                id: 'create-release',
                uses: 'actions/create-release@v1',
                env: {
                  GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                },
                with: {
                  tag_name: '${{ github.ref }}',
                  release_name: 'Release ${{ github.ref }}',
                  body: 'Release ${{ github.ref }}',
                  draft: false,
                  prerelease: false,
                },
              },
              {
                name: 'Upload release assets',
                id: 'upload-release-assets',
                uses: 'actions/upload-release-asset@v1',
                env: {
                  GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                },
                with: {
                  upload_url: '${{ steps.create_release.outputs.upload_url }}',
                  asset_path: `target/release/${project.name}`,
                  asset_name: project.name,
                  asset_content_type: 'application/zip',
                },
              },
            ],
          },
        },
      },
    });

    new YamlFile(project, '.github/workflows/rust-build.yml', {
      obj: {
        name: 'ci',
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
          CARGO_TERM_COLOR: 'always',
        },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            'steps': [
              WorkflowActionsX.checkout({}),
              build,
              tests,
            ],
          },
        },
      },
    });
  }
}
