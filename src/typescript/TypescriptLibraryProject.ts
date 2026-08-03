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

    // Insert a debug step into the generated release workflow to list dist/js before publib runs.
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.add('/jobs/release_npm/steps/3', {
        name: 'List dist and dist/js contents (debug)',
        run: 'echo "=== Full dist/ listing ==="\nls -laR dist/ || true\necho "=== dist/js/ listing ==="\nls -la dist/js/ || true\necho "=== Looking for .tgz files ==="\nfind dist/ -name "*.tgz" -type f || true',
      }),
    );

    // Ensure publib-npm looks in dist/js (the expected location)
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.replace('/jobs/release_npm/steps/4/run', 'npx -p publib@latest publib-npm dist/js'),
    );
  }
}
