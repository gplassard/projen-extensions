import { Project, ProjectOptions } from 'projen';
import { GitHub, PullRequestLintOptions } from 'projen/lib/github';
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
  applyGithubActionsOverrides,
} from '../github';
import { DatadogInfraAsCodeSecurityAction } from '../github/DatadogInfraAsCodeSecurityAction';
import { DatadogSecretScanningAction, DatadogSecretScanningActionProps } from '../github/DatadogSecretScanningAction';

export interface BaseProjectProps extends ProjectOptions {
  readonly customGitignore?: CustomGitignoreProps;
  readonly pullRequestLintOptions?: PullRequestLintOptions;
  readonly nodeJSDependenciesUpgrade?: boolean;
  readonly nodeJSDependenciesUpgradeOptions?: NodeJSDependenciesUpgradeActionProps;
  readonly projenSynth?: boolean;
  readonly projenSynthOptions?: ProjenSynthActionProps;
  readonly datadog?: {
    readonly softwareCompositionAnalysis?: boolean;
    readonly softwareCompositionAnalysisOptions?: DatadogSoftwareCompositionAnalysisActionProps;
    readonly staticAnalysis?: boolean;
    readonly staticAnalysisOptions?: DatadogStaticAnalysisActionProps;
    readonly secretScanning?: boolean;
    readonly secretScanningOptions?: DatadogSecretScanningActionProps;
    readonly infrastructureAsCodeSecurity?: boolean;
    readonly infrastructureAsCodeSecurityOptions?: DatadogSecretScanningActionProps;
  };
}

export class BaseProject extends Project {
  constructor(props: BaseProjectProps) {
    super(props);

    new CustomGitignore(this, props.customGitignore);

    const github = GitHub.of(this) ?? new GitHub(this, {
      mergify: false,
      pullRequestLintOptions: props.pullRequestLintOptions ?? DEFAULT_PULL_REQUEST_LINT_OPTIONS,
    });
    applyGithubActionsOverrides(github);

    if (props.nodeJSDependenciesUpgrade ?? true) {
      new NodeJSDependenciesUpgradeAction(github, props.nodeJSDependenciesUpgradeOptions ?? {});
    }

    if (props.projenSynth ?? true) {
      new ProjenSynthAction(github, props.projenSynthOptions ?? {});
    }

    if (props.datadog?.softwareCompositionAnalysis ?? true) {
      new DatadogSoftwareCompositionAnalysisAction(github, props.datadog?.softwareCompositionAnalysisOptions ?? {
        ddService: this.name,
      });
    }
    if (props.datadog?.staticAnalysis ?? true) {
      new DatadogStaticAnalysisAction(github, props.datadog?.staticAnalysisOptions ?? {});
    }
    if (props.datadog?.secretScanning ?? true) {
      new DatadogSecretScanningAction(github, props.datadog?.secretScanningOptions ?? {});
    }
    if (props.datadog?.infrastructureAsCodeSecurity ?? true) {
      new DatadogInfraAsCodeSecurityAction(github, props.datadog?.infrastructureAsCodeSecurityOptions ?? {});
    }

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
  }
}

