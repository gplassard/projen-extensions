import { IConstruct } from 'constructs';
import { Component, Project, YamlFile } from 'projen';
import { configureAWSCredentialsStep, GENERATE_CODE_ARTIFACT_TOKEN_STEP, SETUP_JDK_STEP } from './utils';
import { CHECKOUT_STEP } from '../github/utils';

export interface GradleReleaseActionProps {
  libraryName: string;
  tagPattern: string;
  gradle: {
    githubRegistryPublishTasks: string[];
    codeArtifactPublishTasks: string[];
  };
}
export class GradleReleaseAction extends Component {

  constructor(scope: IConstruct, props: GradleReleaseActionProps) {
    super(scope);

    new YamlFile(Project.of(scope).root, `.github/workflows/release-${props.libraryName}.yml`, {
      obj: {
        name: `Java release ${props.libraryName}`,
        on: {
          push: {
            tags: [props.tagPattern],
          },
        },
        jobs: {
          'publish-github': this.releaseJob({
            codeArtifactRole: 'CODE_ARTIFACT_READ_ROLE',
            publishTasks: props.gradle.githubRegistryPublishTasks,
            publishTaskEnv: {
              GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
            },
          }),
          'publish-codeArtifact': this.releaseJob({
            codeArtifactRole: 'CODE_ARTIFACT_WRITE_ROLE',
            publishTasks: props.gradle.codeArtifactPublishTasks,
            publishTaskEnv: {
              CODEARTIFACT_AUTH_TOKEN: '${{ steps.code-artifact-token.outputs.token }}',
            },
          }),
        },
      },
    });

  }

  private releaseJob(input: {
    codeArtifactRole: string;
    publishTasks: string[];
    publishTaskEnv: Record<string, string>;
  }) {
    return {
      'runs-on': 'ubuntu-latest',
      'env': {
        CODE_ARTIFACT_URL: '${{ secrets.CODE_ARTIFACT_URL}}',
      },
      'permissions': {
        'contents': 'read',
        'packages': 'write',
        'id-token': 'write',
      },
      'steps': [
        CHECKOUT_STEP,
        SETUP_JDK_STEP,
        configureAWSCredentialsStep(input.codeArtifactRole),
        // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#example-masking-a-generated-output-within-a-single-job
        GENERATE_CODE_ARTIFACT_TOKEN_STEP,
        {
          name: 'Build',
          run: './gradlew build -x integrationTest',
          env: {
            CODEARTIFACT_AUTH_TOKEN: '${{ steps.code-artifact-token.outputs.token }}',
            CODE_ARTIFACT_URL: '${{ secrets.CODE_ARTIFACT_URL }}',
          },
        },
        input.publishTasks.map(task => ({
          name: 'Publish package',
          run: `./gradlew ${task}`,
          env: input.publishTaskEnv,
        })),
      ],
    };
  }
}
