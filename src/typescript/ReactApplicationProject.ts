import { TypescriptApplicationProject, TypescriptApplicationProjectOptions } from './TypescriptApplicationProject';

export type ReactApplicationProjectProps = TypescriptApplicationProjectOptions;

export class ReactApplicationProject extends TypescriptApplicationProject {
  constructor(options: ReactApplicationProjectProps) {
    const typescriptProjectOptions: TypescriptApplicationProjectOptions = {
      jest: false,
      ...options,
    };
    super(typescriptProjectOptions);
  }
}
