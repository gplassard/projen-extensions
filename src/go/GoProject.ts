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
    super({
      ...options,
      pullRequestLintOptions: options.pullRequestLintOptions ?? (options.parent ? { enabled: false } : undefined),
      nodeJSDependenciesUpgrade: options.nodeJSDependenciesUpgrade ?? (options.parent ? false : true),
      projenSynth: options.projenSynth ?? (options.parent ? false : true),
      datadog: options.datadog ?? {
        staticAnalysis: options.parent ? false : true,
        softwareCompositionAnalysis: options.parent ? false : true,
      },
    });

    const isRoot = this === this.root;
    const workingDirectory = isRoot ? undefined : this.name;

    const github = GitHub.of(this.root);
    if (!github) {
      return;
    }
    if (options.goBuildWorkflow || options.goBuildWorkflow == undefined) {
      new GoBuildWorkflow(github, {
        workingDirectory,
        ...options.goBuildWorkflowOptions,
      });
    }
    if (options.goLintWorkflow || options.goLintWorkflow == undefined) {
      new GoLintWorkflow(github, {
        workingDirectory,
        ...options.goLintWorkflowOptions,
      });
    }
  }
}
