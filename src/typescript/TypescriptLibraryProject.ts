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

    // download-artifact v8 extracts a lone artifact directly into `path`, whereas v4 created a
    // directory named after it. An explicit path plus merge-multiple gives both versions the same layout.
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.replace('/jobs/release_npm/steps/1/with/path', 'build-artifact'),
      JsonPatch.add('/jobs/release_npm/steps/1/with/merge-multiple', true),
      JsonPatch.replace('/jobs/release_npm/steps/2/run', 'cd build-artifact && setfacl --restore=permissions-backup.acl'),
      JsonPatch.replace('/jobs/release_npm/steps/3/run', 'npx -p publib@latest publib-npm build-artifact/js'),
      JsonPatch.replace('/jobs/release_github/steps/1/with/path', 'build-artifact'),
      JsonPatch.add('/jobs/release_github/steps/1/with/merge-multiple', true),
      JsonPatch.replace('/jobs/release_github/steps/2/run', 'cd build-artifact && setfacl --restore=permissions-backup.acl'),
      JsonPatch.replace('/jobs/release_github/steps/3/run', 'errout=$(mktemp); gh release create $(cat build-artifact/releasetag.txt) -R $GITHUB_REPOSITORY -F build-artifact/changelog.md -t $(cat build-artifact/releasetag.txt) --target $GITHUB_SHA 2> $errout && true; exitcode=$?; if [ $exitcode -ne 0 ] && ! grep -q "Release.tag_name already exists" $errout; then cat $errout; exit $exitcode; fi'),
    );
  }
}
