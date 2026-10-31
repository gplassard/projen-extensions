import { Component } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { githubAction } from './utils';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface DeployGithubPagesWorkflowOptions {
  /**
   * The command to build the site
   * @default 'pnpm run build'
   */
  buildCommand?: string;

  /**
   * The directory containing the built site
   * @default './dist'
   */
  artifactPath?: string;

  /**
   * The branch name where previews are stored
   * @default 'previews'
   */
  previewsBranch?: string;

  /**
   * Whether to include preview environments in the deployment
   * When enabled, active previews from the previews branch will be
   * copied into the artifact before deployment
   * @default false
   */
  includePreviews?: boolean;

  /**
   * The directory where previews should be included in the site
   * @default 'previews'
   */
  previewsDir?: string;
}

export class DeployGithubPagesWorkflow extends Component {
  constructor(scope: GitHub, options: DeployGithubPagesWorkflowOptions) {
    super(scope, 'deploy-github-pages-workflow');

    const previewsBranch = options.previewsBranch ?? 'previews';
    const includePreviews = options.includePreviews ?? false;
    const previewsDir = options.previewsDir ?? 'previews';
    const artifactPath = options.artifactPath ?? './dist';

    const workflow = new GithubWorkflow(scope, 'deploy-website', {
      limitConcurrency: true,
      concurrencyOptions: {
        group: 'deploy-website',
        cancelInProgress: false,
      },
    });
    workflow.on({
      push: {
        branches: ['main'],
      },
      workflowDispatch: {},
    });
    workflow.addJob('deploy', {
      name: 'deploy',
      environment: {
        name: 'github-pages',
        url: '${{ steps.deployment.outputs.deployment_url }}',
      },
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
        packages: JobPermission.READ,
        pages: JobPermission.WRITE,
        idToken: JobPermission.WRITE,
      },
      steps: [
        WorkflowActionsX.checkout({ 'fetch-depth': 0 }),
        ...WorkflowActionsX.setupPnpmSteps({}),
        {
          name: 'Install dependencies',
          run: 'pnpm i --frozen-lockfile',
          env: {
            NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
          },
        },
        {
          name: 'Build',
          run: options.buildCommand ?? 'pnpm run build',
        },
        ...(includePreviews ? [
          {
            name: 'Include preview environments',
            env: {
              GH_TOKEN: '${{ github.token }}',
            },
            run: this.generateIncludePreviewsScript(artifactPath, previewsBranch, previewsDir),
          },
        ] : []),
        {
          name: 'Setup pages',
          uses: githubAction('actions/configure-pages'),
        },
        {
          name: 'Upload artifact',
          uses: githubAction('actions/upload-pages-artifact'),
          with: {
            path: artifactPath,
          },
        },
        {
          name: 'Deploy to Github Pages',
          id: 'deployment',
          uses: githubAction('actions/deploy-pages'),
        },
      ],
    });

  }

  private generateIncludePreviewsScript(artifactPath: string, previewsBranch: string, previewsDir: string): string {
    // Build the script as an array of lines and join with newlines
    // This avoids template literal interpretation issues
    const lines = [
      'REPO_URL="https://x-access-token:\${GH_TOKEN}@github.com/\${GITHUB_REPOSITORY}.git"',
      'if git ls-remote --exit-code --heads "$REPO_URL" ' + previewsBranch + ' > /dev/null 2>&1; then',
      '  git clone --depth 1 --single-branch --branch ' + previewsBranch + ' "$REPO_URL" "${{ runner.temp }}/previews"',
      '  mkdir -p ' + artifactPath + '/' + previewsDir,
      '  rsync -a --exclude=.git "${{ runner.temp }}/previews/" ' + artifactPath + '/' + previewsDir + '/',
      'else',
      "  echo 'No preview environments to include'",
      'fi',
    ];
    return lines.join('\n');
  }
}
