import { Component, JsonFile, SampleFile } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { githubAction } from './utils';
import { WorkflowActionsX } from './WorkflowActionsX';

export enum ReleaseType {
  RUST = 'rust',
}

export interface ReleasePleaseProps {
  releaseType: ReleaseType;
}

export class ReleasePlease extends Component {
  constructor(scope: GitHub, props: ReleasePleaseProps) {
    super(scope);

    new JsonFile(this, 'release-please-config.json', {
      obj: {
        packages: {
          '.': {
            'changelog-path': 'CHANGELOG.md',
            'release-type': props.releaseType,
            'bump-minor-pre-major': false,
            'bump-patch-for-minor-pre-major': false,
            'draft': false,
            'prerelease': false,
            'pull-request-title-pattern': 'chore(release): release ${version}',
            'include-component-in-tag': false,
          },
        },
        $schema: 'https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json',
      },
    });

    new SampleFile(this.project, '.release-please-manifest.json', {
      contents: JSON.stringify({
        '.': '0.0.0',
      }, undefined, 2),
    });

    const workflow = new GithubWorkflow(scope, 'release-please', {});
    workflow.on({
      push: {
        branches: ['main'],
      },
    });
    workflow.addJob('release-please', {
      runsOn: ['ubuntu-latest'],
      permissions: {},
      steps: [
        WorkflowActionsX.generateGithubToken({
          permissions: {
            'permission-pull-requests': 'write',
            'permission-contents': 'write',
          },
        }),
        {
          name: 'Release Please',
          uses: githubAction('googleapis/release-please-action'),
          with: {
            token: '${{ steps.generate_token.outputs.token }}',
          },
        },
      ],
    });
  }
}
