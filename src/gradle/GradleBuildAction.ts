import { IConstruct } from 'constructs';
import { Component, Project, YamlFile } from 'projen';
import { configureAWSCredentialsStep, GENERATE_CODE_ARTIFACT_TOKEN_STEP, SETUP_JDK_STEP } from './utils';
import { WorkflowActionsX } from '../github';

export interface GradleBuildActionProps {
  withCodeArtifactAccess?: boolean;
  gradleCommand?: string;
}
export class GradleBuildAction extends Component {

  constructor(scope: IConstruct, props: GradleBuildActionProps) {
    super(scope);

    const env: Record<string, any> = {};
    const permissions: Record<string, any> = {
      content: 'read',
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
          pull_request: {},
        },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            'env': env,
            'permissions': permissions,
            'steps': [
              WorkflowActionsX.checkout({}),
              SETUP_JDK_STEP,
              props.withCodeArtifactAccess && configureAWSCredentialsStep('CODE_ARTIFACT_READ_ROLE'),
              props.withCodeArtifactAccess && GENERATE_CODE_ARTIFACT_TOKEN_STEP,
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
