import { Project, ProjectOptions } from 'projen';
import { Cargo, CargoProps } from './Cargo';
import { RustRelease, RustReleaseProps } from './RustRelease';
import { RustBuildActions, RustBuildActionsProps, RustReleaseActions, RustReleaseActionsProps } from './workflows';
import { CustomGitignore, CustomGitignoreProps } from '../git';
import { PullRequestLintActions } from '../github';

export interface RustProjectOptions extends ProjectOptions {
  cargo: CargoProps;
  releaseScript?: RustReleaseProps;
  customGitignore?: CustomGitignoreProps;
  rustReleaseActions?: RustReleaseActionsProps;
  rustBuildActions?: RustBuildActionsProps;
  pullRequestLintActions?: PullRequestLintActions;
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
    new RustRelease(this, options.releaseScript ?? { githubRepo: { owner: 'gplassard', repository: this.name } });
    new RustReleaseActions(this, options.rustReleaseActions);
    new RustBuildActions(this, options.rustBuildActions);
    new PullRequestLintActions(this, options.pullRequestLintActions);
  }
}
