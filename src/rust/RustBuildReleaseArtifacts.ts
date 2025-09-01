import { Component, Project, YamlFile } from 'projen';
import { CARGO_TEST, cargoBuild, cargoCaches } from './utils';
import { WorkflowActionsX } from '../github';

export interface RustBuildReleaseArtifactsProps {

}
export class RustBuildReleaseArtifacts extends Component {

  constructor(project: Project, _props?: RustBuildReleaseArtifactsProps) {
    super(project);

    const buildMatrix = [
      {
        build: 'linux',
        os: 'ubuntu-latest',
        target: 'x86_64-unknown-linux-gnu',
        suffix: '',
      },
      {
        build: 'macos',
        os: 'macos-latest',
        target: 'x86_64-apple-darwin',
        suffix: '',
      },
      {
        build: 'windows-gnu',
        os: 'windows-latest',
        target: 'x86_64-pc-windows-gnu',
        suffix: '.exe',
      },
    ];

    new YamlFile(project, '.github/workflows/rust-build-release-artifacts.yml', {
      obj: {
        name: 'rust-build-release-artifacts',
        on: {
          release: {
            types: ['published'],
          },
        },
        env: {
          CARGO_TERM_COLOR: 'always',
        },
        jobs: {
          build: {
            'name': 'Build on ${{ matrix.os }}',
            'runs-on': '${{ matrix.os }}',
            'strategy': {
              matrix: {
                include: buildMatrix,
              },
            },
            'steps': [
              WorkflowActionsX.checkout({}),
              {
                name: 'Install toolchain',
                uses: 'dtolnay/rust-toolchain@stable',
                with: {
                  targets: '${{ matrix.target }}',
                },
              },
              cargoBuild({ release: true, target: '${{ matrix.target }}' }),
              CARGO_TEST,
              ...cargoCaches({ cachePrefix: '${{ matrix.target }}-' }),
              {
                name: 'Upload Artifacts',
                uses: 'actions/upload-artifact@v4',
                with: {
                  name: '${{ matrix.target }}-binaries',
                  path: `target/$\{{ matrix.target }}/release/${project.name}\${{ matrix.suffix }}`,
                },
              },
            ],
          },
          release: {
            'needs': 'build',
            'runs-on': 'ubuntu-latest',
            'permissions': {
              contents: 'write',
            },
            'steps': [
              {
                name: 'Download Artifacts',
                uses: 'actions/download-artifact@v4',
              },
              {
                name: 'Look up existing release upload URL',
                id: 'get_release',
                shell: 'bash',
                env: {
                  GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                },
                run: [
                  'api_url="https://api.github.com/repos/${{ github.repository }}"',
                  'tag="${{ github.event.release.tag_name }}"',
                  '# Find release by tag',
                  'resp=$(curl -sSL -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "$api_url/releases/tags/$tag")',
                  'upload_url=$(echo "$resp" | jq -r \'\.upload_url\')',
                  'if [ -z "$upload_url" ] || [ "$upload_url" = "null" ]; then',
                  '  echo "Could not find existing release for tag $tag. Ensure release-please created it." >&2',
                  '  exit 1',
                  'fi',
                  '# Trim the templated part {?name,label}',
                  'upload_url=${upload_url%%\{*}',
                  'echo "upload_url=$upload_url" >> $GITHUB_OUTPUT',
                ].join('\n'),
              },
              ...buildMatrix.map(matrix => ({
                name: `Upload release assets (${matrix.target})`,
                id: `upload-release-assets-${matrix.target}`,
                uses: 'actions/upload-release-asset@v1',
                env: {
                  GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                },
                with: {
                  upload_url: '${{ steps.get_release.outputs.upload_url }}',
                  asset_path: `${matrix.target}-binaries/${project.name}${matrix.suffix}`,
                  asset_name: `${project.name}-${matrix.target}${matrix.suffix}`,
                  asset_content_type: 'application/octet-stream',
                },
              })),
            ],
          },
        },
      },
    });
  }
}
