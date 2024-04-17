import { Component, Project, YamlFile } from 'projen';
import { configureAWSCredentialsStep, GENERATE_CODE_ARTIFACT_TOKEN_STEP, SETUP_JDK_STEP } from './utils';
import { CHECKOUT_STEP } from '../github/utils';
import { IConstruct } from 'constructs';

export interface GradleBuildActionProps {
}
export class GradleBuildAction extends Component {

  constructor(scope: IConstruct, _props: GradleBuildActionProps) {
    super(scope);
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
            'env': {
              CODE_ARTIFACT_URL: '${{ secrets.CODE_ARTIFACT_URL}}',
            },
            'permissions': {
              'id-token': 'write',
            },
            'steps': [
              CHECKOUT_STEP,
              SETUP_JDK_STEP,
              configureAWSCredentialsStep('CODE_ARTIFACT_READ_ROLE'),
              GENERATE_CODE_ARTIFACT_TOKEN_STEP,
              {
                name: 'Build',
                run: './gradlew build -x integrationTest',
                env: {
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
