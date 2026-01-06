import { Project, ProjectOptions } from 'projen';
import { GitHub } from 'projen/lib/github';
import { GoBuildWorkflow, GoBuildWorkflowProps } from './GoBuildWorkflow';
import { GoLintWorkflow, GoLintWorkflowProps } from './GoLintWorkflow';
import { CustomGitignore, CustomGitignoreProps } from '../git';
import {
  DatadogSoftwareCompositionAnalysisAction,
  DatadogSoftwareCompositionAnalysisActionProps,
  DatadogStaticAnalysisAction,
  DatadogStaticAnalysisActionProps,
  DEFAULT_PULL_REQUEST_LINT_OPTIONS,
  NodeJSDependenciesUpgradeAction,
  NodeJSDependenciesUpgradeActionProps,
  ProjenSynthAction,
  ProjenSynthActionProps,
} from '../github';

export interface GoProjectOptions extends ProjectOptions {
  customGitignore?: CustomGitignoreProps;
  nodeJSDependenciesUpgradeAction?: boolean;
  nodeJSDependenciesUpgradeActionOptions?: NodeJSDependenciesUpgradeActionProps;
  projenSynthAction?: boolean;
  projenSynthActionOptions?: ProjenSynthActionProps;
  goBuildWorkflow?: boolean;
  goBuildWorkflowOptions?: GoBuildWorkflowProps;
  goLintWorkflow?: boolean;
  goLintWorkflowOptions?: GoLintWorkflowProps;
  datadog?: {
    softwareCompositionAnalysis?: boolean;
    softwareCompositionAnalysisOptions?: DatadogSoftwareCompositionAnalysisActionProps;
    staticAnalysis?: boolean;
    staticAnalysisOptions?: DatadogStaticAnalysisActionProps;
  };
}

export class GoProject extends Project {
  constructor(options: GoProjectOptions) {
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

    const github = new GitHub(this, {
      mergify: false,
      pullRequestLintOptions: DEFAULT_PULL_REQUEST_LINT_OPTIONS,
    });
    if (options.goBuildWorkflow || options.goBuildWorkflow == undefined) {
      new GoBuildWorkflow(github, options.goBuildWorkflowOptions ?? {});
    }
    if (options.goLintWorkflow || options.goLintWorkflow == undefined) {
      new GoLintWorkflow(github, options.goLintWorkflowOptions ?? {});
    }

    if (options.nodeJSDependenciesUpgradeAction || options.nodeJSDependenciesUpgradeAction == undefined) {
      new NodeJSDependenciesUpgradeAction(github, options.nodeJSDependenciesUpgradeActionOptions ?? {});
    }
    if (options.projenSynthAction || options.projenSynthAction == undefined) {
      new ProjenSynthAction(github, options.projenSynthActionOptions ?? {});
    }
    if (options.datadog?.softwareCompositionAnalysis ?? true) {
      new DatadogSoftwareCompositionAnalysisAction(github, options.datadog?.softwareCompositionAnalysisOptions ?? {
        ddService: options.name,
      });
    }
    if (options.datadog?.staticAnalysis ?? true) {
      new DatadogStaticAnalysisAction(github, options.datadog?.staticAnalysisOptions ?? {});
    }
  }
}
