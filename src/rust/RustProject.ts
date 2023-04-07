import { Project, ProjectOptions } from 'projen';
import { Cargo, CargoProps } from './Cargo';
import { RustBuildActions, RustBuildActionsProps, RustReleaseActions, RustReleaseActionsProps } from './workflows';
import { CustomGitignore, CustomGitignoreProps } from '../git';

export interface RustProjectOptions extends ProjectOptions {
  cargo: CargoProps;
  customGitignore?: CustomGitignoreProps;
  rustReleaseActions?: RustReleaseActionsProps;
  rustBuildActions?: RustBuildActionsProps;
}

export class RustProject extends Project {
  constructor(options: RustProjectOptions) {
    super(options);
    new CustomGitignore(this, options.customGitignore);

    this.removeTask('eject');
    this.removeTask('build');
    this.removeTask('default');
    this.addTask('default', {
      description: 'Synthesize project files',
      steps: [
        {
          exec: 'node .projenrc.js',
        },
      ],
    });

    new Cargo(this, options.cargo);
    new RustReleaseActions(this, options.rustReleaseActions);
    new RustBuildActions(this, options.rustBuildActions);
  }
}
