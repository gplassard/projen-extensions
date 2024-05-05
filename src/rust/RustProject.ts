import { Project, ProjectOptions } from 'projen';
import { GitHub } from 'projen/lib/github';
import { Cargo, CargoProps } from './Cargo';
import { RustLintAction, RustLintActionProps } from './RustLintAction';
import { RustReleaseActions, RustReleaseActionsProps } from './RustReleaseActions';
import { CustomGitignore, CustomGitignoreProps } from '../git';
import { DEFAULT_PULL_REQUEST_LINT_OPTIONS } from '../github/utils';
import { NodeJSDependenciesUpgradeAction, NodeJSDependenciesUpgradeActionProps, ProjenSynthAction, ProjenSynthActionProps } from '../github';

export interface RustProjectOptions extends ProjectOptions {
  cargo: CargoProps;
  customGitignore?: CustomGitignoreProps;
  nodeJSDependenciesUpgradeAction?: boolean;
  nodeJSDependenciesUpgradeActionOptions?: NodeJSDependenciesUpgradeActionProps;
  projenSynthAction?: boolean;
  projenSynthActionOptions?: ProjenSynthActionProps;
  rustReleaseActions?: RustReleaseActionsProps;
  rustLintActions?: RustLintActionProps;
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
    new RustLintAction(this, options.rustLintActions);
    const github = new GitHub(this, {
      mergify: false,
      pullRequestLintOptions: DEFAULT_PULL_REQUEST_LINT_OPTIONS,
    });
    (options.nodeJSDependenciesUpgradeAction || options.nodeJSDependenciesUpgradeAction == undefined)
    && new NodeJSDependenciesUpgradeAction(github, options.nodeJSDependenciesUpgradeActionOptions ?? {});
  (options.projenSynthAction || options.projenSynthAction == undefined) && new ProjenSynthAction(github, options.projenSynthActionOptions ?? {});
  }
}
