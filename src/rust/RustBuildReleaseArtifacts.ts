import { Component, Project, YamlFile } from 'projen';
import { CARGO_TEST, cargoBuild, cargoCaches } from './utils';
import { WorkflowActionsX, githubAction } from '../github';

export interface RustBuildReleaseArtifactsProps {
  readonly msvc?: boolean;
}
export class RustBuildReleaseArtifacts extends Component {

  constructor(project: Project, props?: RustBuildReleaseArtifactsProps) {
    super(project);

    const buildMatrix = [
      {
        build: 'linux',
        os: 'ubuntu-latest',
        target: 'x86_64-unknown-linux-gnu',
        suffix: '',
      },
      {
        build: 'linux-arm',
        os: 'ubuntu-24.04-arm',
        target: 'aarch64-unknown-linux-gnu',
        suffix: '',
      },
      {
        build: 'macos',
        os: 'macos-latest',
        target: 'x86_64-apple-darwin',
        suffix: '',
      },
      {
        build: 'macos-arm',
        os: 'macos-latest',
        target: 'aarch64-apple-darwin',
        suffix: '',
      },
      props?.msvc
        ? {
          build: 'windows-msvc',
          os: 'windows-latest',
          target: 'x86_64-pc-windows-msvc',
          suffix: '.exe',
        }
        : {
          build: 'windows-gnu',
          os: 'windows-latest',
          target: 'x86_64-pc-windows-gnu',
          suffix: '.exe',
        },
    ];

    const copyCommands = buildMatrix.map(
      (m) => `cp ${m.target}-binaries/${project.name}${m.suffix} ${project.name}-${m.target}${m.suffix}`,
    );
    const uploadFiles = buildMatrix.map((m) => `            ${project.name}-${m.target}${m.suffix}`);

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
              ...(props?.msvc ? [
                WorkflowActionsX.setupMsvcDevCmd({
                  if: "contains(matrix.target, 'msvc')",
                }),
              ] : []),
              cargoBuild({ release: true, target: '${{ matrix.target }}' }),
              CARGO_TEST,
              ...cargoCaches({ cachePrefix: '${{ matrix.target }}-' }),
              {
                name: 'Upload Artifacts',
                uses: githubAction('actions/upload-artifact'),
                with: {
                  'name': '${{ matrix.target }}-binaries',
                  'path': `target/$\{{ matrix.target }}/release/${project.name}\${{ matrix.suffix }}`,
                  'retention-days': 1,
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
                  ...copyCommands,
                  '# Upload assets to the existing release created by release-please',
                  `gh release upload "$TAG" \\\n${uploadFiles.join(' \\\n')} \\\n            --clobber`,
                ].join('\n'),
              },
            ],
          },
        },
      },
    });
  }
}
