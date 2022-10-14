// eslint-disable-next-line import/no-extraneous-dependencies
import { Project, ProjectOptions, TomlFile, YamlFile } from 'projen';

export interface RustProjectOptions extends ProjectOptions {
  cargo: {
    package: {
      version: string;
      authors: string[];
      edition: '2021';
    };
    dependencies: Record<string, string>;
  };
}

export class RustProject extends Project {
  constructor(options: RustProjectOptions) {
    super(options);

    new TomlFile(this, 'cargo.toml', {
      obj: {
        ...options.cargo,
        package: {
          ...options.cargo.package,
          name: options.name
        }
      },
    });

    const checkout = {
      uses: 'actions/checkout@v2',
      with: {
        'fetch-depth': 0,
      },
    };
    const build = {
      name: 'Build',
      run: 'cargo build --release',
    };
    const tests = {
      name: 'Tests',
      run: 'cargo test --verbose',
    };

    new YamlFile(this, '.github/workflows/rust-release.yml', {
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
              checkout,
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
                  asset_path: 'Release ${{ github.ref }}',
                  asset_name: options.name,
                  asset_content_type: 'application/zip',
                },
              },
            ],
          },
        },
      },
    });

    new YamlFile(this, '.github/workflows/rust-build.yml', {
      obj: {
        name: 'ci',
        on: {
          push: {
            branches: ['master'],
          },
          pull_request: {
            types: ['opened', 'edited', 'reopened'],
            branches: ['master'],
          },
        },
        env: {
          CARGO_TERM_COLOR: 'always',
        },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            'steps': [
              {
                uses: 'action/checkout@v2',
                with: {
                  'fetch-depth': 0,
                },
              },
              {
                name: 'Build',
                run: 'cargo build --release',
              },
              {
                name: 'Tests',
                run: 'cargo test --verbose',
              },
            ],
          },
        },
      },
    });
  }
}
