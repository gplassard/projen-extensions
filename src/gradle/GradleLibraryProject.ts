import { Project, ProjectOptions } from 'projen';
import { GitHub } from 'projen/lib/github';
import { GradleBuildAction, GradleBuildActionProps } from './GradleBuildAction';
import { GradleReleaseAction, GradleReleaseActionProps } from './GradleReleaseAction';
import { CustomGitignore, CustomGitignoreProps } from '../git';
import { NodeJSDependenciesUpgradeAction, NodeJSDependenciesUpgradeActionProps, ProjenSynthAction, ProjenSynthActionProps } from '../github';
import { DEFAULT_PULL_REQUEST_LINT_OPTIONS } from '../github/utils';

export interface GradleLibraryProjectOptions extends ProjectOptions {
  githubLint?: boolean;
  githubLintOptions?: Record<string, unknown>;
  gradleBuildAction?: boolean;
  gradleBuildActionOptions?: GradleBuildActionProps;
  gradleReleaseActionOptions?: GradleReleaseActionProps;
  nodeJSDependenciesUpgradeAction?: boolean;
  nodeJSDependenciesUpgradeActionOptions?: NodeJSDependenciesUpgradeActionProps;
  projenSynthAction?: boolean;
  projenSynthActionOptions?: ProjenSynthActionProps;

  customGitignore?: CustomGitignoreProps;
}

export class GradleLibraryProject extends Project {
  constructor(options: GradleLibraryProjectOptions) {
    super(options);

    new CustomGitignore(this, {
      additionalGitignore: [
        '.gradle',
        'build',
        ...(options.customGitignore?.additionalGitignore ?? []),
      ],
    });
    const github = new GitHub(this, {
      mergify: false,
      pullRequestLint: options.githubLint || options.githubLint == undefined,
      pullRequestLintOptions: {
        ...DEFAULT_PULL_REQUEST_LINT_OPTIONS,
        ...(options.githubLintOptions ?? {}),
      },
    });

    options.gradleReleaseActionOptions && new GradleReleaseAction(this, options.gradleReleaseActionOptions);
    (options.gradleBuildAction || options.gradleBuildAction == undefined) && new GradleBuildAction(this, options.gradleBuildActionOptions ?? {});
    (options.nodeJSDependenciesUpgradeAction || options.nodeJSDependenciesUpgradeAction == undefined)
      && new NodeJSDependenciesUpgradeAction(github, options.nodeJSDependenciesUpgradeActionOptions ?? {});
    (options.projenSynthAction || options.projenSynthAction == undefined) && new ProjenSynthAction(github, options.projenSynthActionOptions ?? {});
  }
}
