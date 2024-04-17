import { Project, ProjectOptions } from 'projen';
import { GitHub } from 'projen/lib/github';
import { GradleBuildAction, GradleBuildActionProps } from './GradleBuildAction';
import { GradleReleaseAction, GradleReleaseActionProps } from './GradleReleaseAction';
import { CustomGitignore, CustomGitignoreProps } from '../git';
import { DEFAULT_PULL_REQUEST_LINT_OPTIONS } from '../github/utils';

export interface GradleLibraryProjectOptions extends ProjectOptions {
  githubLint?: Record<string, unknown>;
  gradleBuildAction?: GradleBuildActionProps;
  gradleReleaseAction?: GradleReleaseActionProps;
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
    options.githubLint && new GitHub(this, {
      mergify: false,
      pullRequestLintOptions: DEFAULT_PULL_REQUEST_LINT_OPTIONS,
    });
    options.gradleReleaseAction && new GradleReleaseAction(this, options.gradleReleaseAction);
    options.gradleBuildAction && new GradleBuildAction(this, options.gradleBuildAction);
  }
}
