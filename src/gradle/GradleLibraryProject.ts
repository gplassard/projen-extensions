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
  public readonly github: GitHub;
  constructor(options: GradleLibraryProjectOptions) {
    super(options);

    new CustomGitignore(this, {
      additionalGitignore: [
        '.gradle',
        'build',
        ...(options.customGitignore?.additionalGitignore ?? []),
      ],
    });
    this.github = new GitHub(this, {
      mergify: false,
      pullRequestLint: options.githubLint || options.githubLint == undefined,
      pullRequestLintOptions: {
        ...DEFAULT_PULL_REQUEST_LINT_OPTIONS,
        ...(options.githubLintOptions ?? {}),
      },
    });

    if (options.gradleReleaseActionOptions) {
      new GradleReleaseAction(this.github, options.gradleReleaseActionOptions);
    }
    if (options.gradleBuildAction ?? true) {
      new GradleBuildAction(this, options.gradleBuildActionOptions ?? {});
    }
    if (options.nodeJSDependenciesUpgradeAction ?? true) {
      new NodeJSDependenciesUpgradeAction(this.github, options.nodeJSDependenciesUpgradeActionOptions ?? {});
    }
    if (options.projenSynthAction ?? true) {
      new ProjenSynthAction(this.github, options.projenSynthActionOptions ?? {});
    }
  }
}
