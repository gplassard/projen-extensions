import { GitHub } from 'projen/lib/github';
import { RustBuildAction, RustBuildActionProps } from './RustBuildAction';
import { RustBuildReleaseArtifacts, RustBuildReleaseArtifactsProps } from './RustBuildReleaseArtifacts';
import { RustLintAction, RustLintActionProps } from './RustLintAction';
import { ReleasePlease, ReleasePleaseProps, ReleaseType } from '../github/ReleasePlease';
import { BaseProject, BaseProjectProps } from '../project';

export interface RustProjectOptions extends BaseProjectProps {
  rustBuildAction?: RustBuildActionProps;
  rustBuildReleaseArtifactsAction?: RustBuildReleaseArtifactsProps;
  rustLintActions?: RustLintActionProps;
  releasePlease?: boolean;
  releasePleaseOptions?: ReleasePleaseProps;
}

export class RustProject extends BaseProject {
  constructor(options: RustProjectOptions) {
    super(options);
    this.addGitIgnore('target');

    new RustBuildAction(this, options.rustBuildAction);
    new RustBuildReleaseArtifacts(this, options.rustBuildReleaseArtifactsAction);
    new RustLintAction(this, options.rustLintActions);

    const github = GitHub.of(this)!;
    if (options.releasePlease || options.releasePlease == undefined) {
      new ReleasePlease(github, {
        releaseType: options.releasePleaseOptions?.releaseType ?? ReleaseType.RUST,
      });
    }
  }
}
