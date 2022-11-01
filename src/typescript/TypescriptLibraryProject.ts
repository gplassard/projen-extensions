import { TypescriptApplicationProject, TypescriptApplicationProjectOptions } from './TypescriptApplicationProject';

export type TypescriptLibraryProjectOptions = TypescriptApplicationProjectOptions
& Required<Pick<TypescriptApplicationProjectOptions, 'packageName'>>;

export class TypescriptLibraryProject extends TypescriptApplicationProject {

  constructor(options: TypescriptLibraryProjectOptions) {
    const typescriptProjectOptions = {
      publishTasks: true,
      releaseToNpm: true,
      npmRegistryUrl: 'https://npm.pkg.github.com',
      ...options,
    };
    super(typescriptProjectOptions);
  }
}
