import { JsonPatch } from 'projen';
import { TypescriptApplicationProject, TypescriptApplicationProjectOptions } from './TypescriptApplicationProject';
import { nodeVersion } from '../github';

export type TypescriptLibraryProjectOptions = TypescriptApplicationProjectOptions
& Required<Pick<TypescriptApplicationProjectOptions, 'packageName'>>;

export class TypescriptLibraryProject extends TypescriptApplicationProject {

  constructor(options: TypescriptLibraryProjectOptions) {
    const typescriptProjectOptions: TypescriptApplicationProjectOptions = {
      publishTasks: true,
      release: true,
      releaseToNpm: true,
      npmRegistryUrl: 'https://npm.pkg.github.com',
      ...options,
    };
    super(typescriptProjectOptions);
    this.tryFindObjectFile('.github/workflows/release.yml')?.addOverride('jobs.release_npm.steps.0.with.node-version', nodeVersion(options));

    // Fix artifact download path: download to current dir instead of dist/ to avoid nesting
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.replace('/jobs/release_npm/steps/1/with/path', '.'),
    );

    // Fix restore permissions step: files are now in current dir, not dist/
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.replace('/jobs/release_npm/steps/2/run', 'setfacl --restore=permissions-backup.acl || true'),
    );

    // Update debug step to look in the correct location
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.add('/jobs/release_npm/steps/3', {
        name: 'List build-artifact contents (debug)',
        run: 'echo "=== Full listing ==="\nls -laR . || true\necho "=== Looking for .tgz files ==="\nfind . -name "*.tgz" -type f || true',
      }),
    );

    // Update publib-npm to look in build-artifact/js (where the artifact is extracted)
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.replace('/jobs/release_npm/steps/4/run', 'npx -p publib@latest publib-npm build-artifact/js'),
    );
  }
}
