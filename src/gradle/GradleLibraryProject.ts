import { Project, ProjectOptions } from 'projen';
import { GitHub } from 'projen/lib/github';
import { GradleBuildAction, GradleBuildActionProps } from './GradleBuildAction';
import { GradleReleaseAction, GradleReleaseActionProps } from './GradleReleaseAction';
import { DEFAULT_PULL_REQUEST_LINT_OPTIONS } from '../github/utils';

export interface GradleLibraryProjectOptions extends ProjectOptions {
  githubLint?: Record<string, unknown>;
  gradleBuildAction?: GradleBuildActionProps;
  gradleReleaseAction?: GradleReleaseActionProps;
}

export class GradleLibraryProject extends Project {
  constructor(options: GradleLibraryProjectOptions) {
    super(options);

    options.githubLint && new GitHub(this, {
      mergify: false,
      pullRequestLintOptions: DEFAULT_PULL_REQUEST_LINT_OPTIONS,
    });
    options.gradleReleaseAction && new GradleReleaseAction(this, options.gradleReleaseAction);
    options.gradleBuildAction && new GradleBuildAction(this, options.gradleBuildAction);
  }
}
