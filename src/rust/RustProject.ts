import { Project, ProjectOptions } from 'projen';
import { CustomGitignore, CustomGitignoreProps } from '../git/CustomGitignore';
import { Cargo, CargoProps } from './Cargo';
import { RustReleaseActions, RustReleaseActionsProps } from './RustReleaseActions';

export interface RustProjectOptions extends ProjectOptions {
  cargo: CargoProps;
  customGitignore?: CustomGitignoreProps;
  rustReleaseActions?: RustReleaseActionsProps;
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
  }
}
