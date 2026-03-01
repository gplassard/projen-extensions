import { Component, Project, YamlFile } from 'projen';
import { CARGO_TEST, cargoBuild, cargoCaches } from './utils';
import { WorkflowActionsX, githubAction } from '../github';

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
                uses: githubAction('dtolnay/rust-toolchain'),
                with: {
                  targets: '${{ matrix.target }}',
                },
              },
              cargoBuild({ release: true, target: '${{ matrix.target }}' }),
              CARGO_TEST,
              ...cargoCaches({ cachePrefix: '${{ matrix.target }}-' }),
              {
                name: 'Upload Artifacts',
                uses: githubAction('actions/upload-artifact'),
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
              WorkflowActionsX.checkout({}),
              {
                name: 'Download Artifacts',
                uses: githubAction('actions/download-artifact'),
              },
              {
                name: 'Upload assets to existing release',
                shell: 'bash',
                env: {
                  GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                  TAG: '${{ github.event.release.tag_name }}',
                },
                run: [
                  'set -euxo pipefail',
                  '# Prepare asset files with desired names',
                  `cp x86_64-unknown-linux-gnu-binaries/${project.name} ${project.name}-x86_64-unknown-linux-gnu`,
                  `cp x86_64-apple-darwin-binaries/${project.name} ${project.name}-x86_64-apple-darwin`,
                  `cp x86_64-pc-windows-gnu-binaries/${project.name}.exe ${project.name}-x86_64-pc-windows-gnu.exe`,
                  '# Upload assets to the existing release created by release-please',
                  `gh release upload "$TAG" \\\n            ${project.name}-x86_64-unknown-linux-gnu \\\n            ${project.name}-x86_64-apple-darwin \\\n            ${project.name}-x86_64-pc-windows-gnu.exe \\\n            --clobber`,
                ].join('\n'),
              },
            ],
          },
        },
      },
    });
  }
}
