import { Construct } from 'constructs';
import { GradleReleaseAction, GradleReleaseActionProps } from './GradleReleaseAction';

export interface GradleSubProjectOptions {
  gradleReleaseActionOptions?: GradleReleaseActionProps;
}

export class GradleSubProject extends Construct {
  constructor(parent: GradleSubProject, id: string, options: GradleSubProjectOptions) {
    super(parent, id);

    options.gradleReleaseActionOptions && new GradleReleaseAction(this, options.gradleReleaseActionOptions);
  }
}
