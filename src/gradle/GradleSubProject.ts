import { Construct } from 'constructs';
import { GradleReleaseAction, GradleReleaseActionProps } from './GradleReleaseAction';

export interface GradleSubProjectOptions {
  gradleReleaseAction?: GradleReleaseActionProps;
}

export class GradleSubProject extends Construct {
  constructor(parent: GradleSubProject, id: string, options: GradleSubProjectOptions) {
    super(parent, id);

    options.gradleReleaseAction && new GradleReleaseAction(this, options.gradleReleaseAction);
  }
}
