import { Component, Project, YamlFile } from 'projen';
import { CARGO_TEST, cargoBuild, cargoCaches } from './utils';
import { WorkflowActionsX } from '../github';

export interface RustReleaseActionsProps {

}
export class RustReleaseActions extends Component {

  constructor(project: Project, _props?: RustReleaseActionsProps) {
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
              content: 'write',
            },
            'steps': [
              {
                name: 'Download Artifacts',
                uses: 'actions/download-artifact@v4',
              },
              {
                name: 'Create release',
                id: 'create_release',
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
              ...buildMatrix.map(matrix => ({
                name: `Upload release assets (${matrix.target})`,
                id: `upload-release-assets-${matrix.target}`,
                uses: 'actions/upload-release-asset@v1',
                env: {
                  GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                },
                with: {
                  upload_url: '${{ steps.create_release.outputs.upload_url }}',
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
