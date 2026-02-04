import { IConstruct } from 'constructs';
import { Component, Project, YamlFile } from 'projen';
import { WorkflowActionsX } from '../github';

export interface GradleBuildActionProps {
  withCodeArtifactAccess?: boolean;
  gradleCommand?: string;
  additionalEnvs?: Record<string, string>;
}
export class GradleBuildAction extends Component {

  constructor(scope: IConstruct, props: GradleBuildActionProps) {
    super(scope);

    const env: Record<string, any> = props.additionalEnvs ?? {};
    const permissions: Record<string, any> = {
      contents: 'read',
    };

    if (props.withCodeArtifactAccess) {
      env.CODE_ARTIFACT_URL = '${{ secrets.CODE_ARTIFACT_URL }}';
      permissions['id-token'] = 'write';
    }

    new YamlFile(Project.of(scope).root, '.github/workflows/build.yml', {
      obj: {
        name: 'Java CI',
        on: {
          push: {
            branches: 'main',
          },
          pull_request: {
            types: ['opened', 'edited', 'synchronize', 'reopened'],
            branches: ['main'],
          },
        },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            'env': env,
            'permissions': permissions,
            'steps': [
              WorkflowActionsX.checkout({}),
              WorkflowActionsX.setupJdk({}),
              props.withCodeArtifactAccess && WorkflowActionsX.configureAwsCredentials('CODE_ARTIFACT_READ_ROLE'),
              props.withCodeArtifactAccess && WorkflowActionsX.generateCodeArtifactToken(),
              {
                name: 'Build',
                run: props.gradleCommand ?? './gradlew build',
                env: props.withCodeArtifactAccess && {
                  CODEARTIFACT_AUTH_TOKEN: '${{ steps.code-artifact-token.outputs.token }}',
                  CODE_ARTIFACT_URL: '${{ secrets.CODE_ARTIFACT_URL }}',
                },
              },
            ],
          },
        },
      },
    });
  }
}
