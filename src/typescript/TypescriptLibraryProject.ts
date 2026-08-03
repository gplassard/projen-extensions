import { TypescriptApplicationProject, TypescriptApplicationProjectOptions } from './TypescriptApplicationProject';
import { nodeVersion } from '../github';
import { JsonPatch } from 'projen';

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

    // Insert a debug step into the generated release workflow to list dist/js before publib runs.
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.add('/jobs/release_npm/steps/3', {
        name: 'List dist/js contents (debug)',
        run: `echo "Listing dist/js"\nls -la dist/js || true\necho "Listing tarball globs"\nls -la dist/js/*.tgz || true`,
      }),
    );
  }
}
