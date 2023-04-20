import { Component, Project, YamlFile } from 'projen';
import { buildTask, checkoutTask, testsTask } from './common';

export interface RustReleaseActionsProps {

}
export class RustReleaseActions extends Component {

  constructor(project: Project, _props?: RustReleaseActionsProps) {
    super(project);

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
              checkoutTask,
              buildTask,
              testsTask,
              {
                name: 'Generate a changelog for current release',
                uses: 'orhun/git-cliff-action@v1',
                id: 'git-cliff',
                with: {
                  config: 'cliff.toml',
                  args: '-vv --latest --strip header',
                },
                env: {
                  OUTPUT: 'CHANGES.md',
                },
              },
              {
                name: 'Set the release body',
                id: 'release',
                shell: 'bash',
                run: [
                  'r=$(cat ${{ steps.git-cliff.outputs.changelog }})',
                  "r=\"${r//'%'/'%25'}\"      # Multiline escape sequences for %",
                  "r=\"${r//$'\\n'/'%0A'}\"   # Multiline escape sequences for '\\n'",
                  "r=\"${r//$'\\r'/'%0D'}\"   # Multiline escape sequences for '\\r'",
                  'echo "::set-output name=RELEASE_BODY::$r"',
                ].join('\n'),
              },
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
                  body: '${{ steps.release.outputs.RELEASE_BODY }}',
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
              {
                name: 'Generate full changelog',
                uses: 'orhun/git-cliff-action@v1',
                with: {
                  config: 'cliff.toml',
                  args: '--verbose',
                },
                env: {
                  OUTPUT: 'Changelog.md',
                },
              },
              {
                name: 'Commit changelog file',
                uses: 'stefanzweifel/git-auto-commit-action@v4',
                with: {
                  commit_message: 'Update changelog',
                  file_pattern: 'Changelog.md',
                  branch: 'main',
                  push_options: '',
                },
              },
            ],
          },
        },
      },
    });
  }
}
