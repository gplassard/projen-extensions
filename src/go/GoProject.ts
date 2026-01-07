import { GitHub } from 'projen/lib/github';
import { GoBuildWorkflow, GoBuildWorkflowProps } from './GoBuildWorkflow';
import { GoLintWorkflow, GoLintWorkflowProps } from './GoLintWorkflow';
import { BaseProject, BaseProjectProps } from '../project';

export interface GoProjectOptions extends BaseProjectProps {
  goBuildWorkflow?: boolean;
  goBuildWorkflowOptions?: GoBuildWorkflowProps;
  goLintWorkflow?: boolean;
  goLintWorkflowOptions?: GoLintWorkflowProps;
}

export class GoProject extends BaseProject {
  constructor(options: GoProjectOptions) {
    super(options);

    const github = GitHub.of(this)!;
    if (options.goBuildWorkflow || options.goBuildWorkflow == undefined) {
      new GoBuildWorkflow(github, options.goBuildWorkflowOptions ?? {});
    }
    if (options.goLintWorkflow || options.goLintWorkflow == undefined) {
      new GoLintWorkflow(github, options.goLintWorkflowOptions ?? {});
    }
  }
}
