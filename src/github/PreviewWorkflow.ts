import { Component } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface PreviewWorkflowOptions {
  /**
   * The base path for preview URLs (e.g., '/my-project/previews')
   * This is appended to the GitHub Pages base URL
   * @default '/previews'
   */
  previewsBasePath?: string;

  /**
   * The directory to build the preview into
   * @default 'dist-preview'
   */
  previewOutputDir?: string;

  /**
   * The command to build the preview
   * This command should use the previewOutputDir and previewsBasePath
   * @default 'pnpm run build'
   */
  buildPreviewCommand?: string;

  /**
   * The directory to build the main site into
   * @default 'dist'
   */
  siteOutputDir?: string;

  /**
   * The command to build the main site
   * @default 'pnpm run build'
   */
  buildSiteCommand?: string;

  /**
   * Preview expiry time in seconds (default: 7 days = 604800 seconds)
   * @default 604800
   */
  previewExpirySeconds?: number;

  /**
   * Prune schedule (cron expression)
   * @default '0 3 * * *'
   */
  pruneSchedule?: string;

  /**
   * The branch name for storing previews
   * @default 'previews'
   */
  previewsBranch?: string;

  /**
   * Environment name prefix for preview environments
   * @default 'preview-pr'
   */
  environmentNamePrefix?: string;

  /**
   * Whether to include previews in the main site deployment
   * When enabled, the deploy workflow will include active previews
   * @default true
   */
  includePreviewsInDeployment?: boolean;

  /**
   * Whether to deploy preview environments immediately when created
   * When enabled, each preview will be deployed to GitHub Pages
   * @default true
   */
  deployPreviews?: boolean;
}

/**
 * Creates a workflow for preview environments on GitHub Pages.
 *
 * This component creates a single workflow that handles:
 * - Creating preview environments for each PR
 * - Posting preview URL as a PR comment
 * - Cleaning up previews when PRs are closed
 * - Pruning expired previews on a schedule
 *
 * The workflow uses a separate branch (default: 'previews') to store all preview builds.
 * Each preview is stored in a directory named `pr-<number>/` within that branch.
 *
 * Example usage:
 * ```typescript
 * const github = project.github!;
 * new PreviewWorkflow(github, {
 *   previewsBasePath: '/my-project/previews',
 *   buildPreviewCommand: 'pnpm run build:preview',
 * });
 * ```
 */
export class PreviewWorkflow extends Component {
  public readonly workflow: GithubWorkflow;

  private readonly options: Required<PreviewWorkflowOptions>;
  private readonly github: GitHub;

  constructor(scope: GitHub, options: PreviewWorkflowOptions = {}) {
    super(scope, 'preview-workflow');

    this.github = scope;
    this.options = {
      previewsBasePath: options.previewsBasePath ?? '/previews',
      previewOutputDir: options.previewOutputDir ?? 'dist-preview',
      buildPreviewCommand: options.buildPreviewCommand ?? 'pnpm run build',
      siteOutputDir: options.siteOutputDir ?? 'dist',
      buildSiteCommand: options.buildSiteCommand ?? 'pnpm run build',
      previewExpirySeconds: options.previewExpirySeconds ?? 604800,
      pruneSchedule: options.pruneSchedule ?? '0 3 * * *',
      previewsBranch: options.previewsBranch ?? 'previews',
      environmentNamePrefix: options.environmentNamePrefix ?? 'preview-pr',
      includePreviewsInDeployment: options.includePreviewsInDeployment ?? true,
      deployPreviews: options.deployPreviews ?? true,
    };

    this.workflow = this.createWorkflow();
  }

  private createWorkflow(): GithubWorkflow {
    const workflow = new GithubWorkflow(this.github, 'preview-website', {
      limitConcurrency: true,
      concurrencyOptions: {
        group: 'preview-${{ github.event.pull_request.number }}',
        cancelInProgress: true,
      },
    });

    workflow.on({
      pullRequest: {
        types: ['opened', 'synchronize', 'reopened', 'closed'],
      },
      schedule: [{
        cron: this.options.pruneSchedule,
      }],
    });

    // Preview job - creates and updates previews
    workflow.addJob('preview', {
      name: 'preview',
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.WRITE,
        packages: JobPermission.READ,
        pullRequests: JobPermission.WRITE,
        pages: JobPermission.WRITE,
        idToken: JobPermission.WRITE,
      },
      environment: {
        name: '${{ format(\'{0}-{1}\', options.environmentNamePrefix, github.event.pull_request.number) }}',
        url: '${{ steps.publish.outputs.url }}',
      },
      if: 'github.event_name == \'pull_request\' && github.event.action != \'closed\' && github.event.pull_request.head.repo.full_name == github.repository',
      steps: [
        // Checkout the PR branch
        WorkflowActionsX.checkout({
          'fetch-depth': 0,
          'ref': '${{ github.event.pull_request.head.ref }}',
          'repository': '${{ github.event.pull_request.head.repo.full_name }}',
        }),
        ...WorkflowActionsX.setupPnpmSteps({}),
        // Build the preview
        {
          name: 'Build preview',
          id: 'build_preview',
          env: {
            PR_NUMBER: '${{ github.event.pull_request.number }}',
          },
          run: this.generateBuildPreviewScript(),
        },
        // Publish preview to the previews branch
        {
          name: 'Publish preview',
          id: 'publish',
          env: {
            PR_NUMBER: '${{ github.event.pull_request.number }}',
            GH_TOKEN: '${{ github.token }}',
          },
          run: this.generatePublishPreviewScript(),
        },
        // Post preview URL as comment
        {
          name: 'Comment preview url',
          id: 'comment_preview_url',
          env: {
            PR_NUMBER: '${{ github.event.pull_request.number }}',
            GH_TOKEN: '${{ github.token }}',
            PREVIEW_URL: '${{ steps.publish.outputs.url }}',
            COMMIT_SHA: '${{ github.event.pull_request.head.sha }}',
            BUILD_TIME: '${{ steps.build_preview.outputs.build_time }}',
          },
          run: this.generateCommentPreviewUrlScript(),
        },
      ],
    });

    // Cleanup job - removes previews when PR is closed
    workflow.addJob('cleanup', {
      name: 'cleanup',
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.WRITE,
        packages: JobPermission.READ,
        pages: JobPermission.WRITE,
        idToken: JobPermission.WRITE,
      },
      if: 'github.event_name == \'pull_request\' && github.event.action == \'closed\' && github.event.pull_request.head.repo.full_name == github.repository',
      steps: [
        WorkflowActionsX.checkout({ 'fetch-depth': 0 }),
        ...WorkflowActionsX.setupPnpmSteps({}),
        {
          name: 'Remove preview',
          env: {
            PR_NUMBER: '${{ github.event.pull_request.number }}',
            GH_TOKEN: '${{ github.token }}',
          },
          run: this.generateRemovePreviewScript(),
        },
      ],
    });

    // Prune job - removes expired previews
    workflow.addJob('prune', {
      name: 'prune',
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.WRITE,
        packages: JobPermission.READ,
        pages: JobPermission.WRITE,
        idToken: JobPermission.WRITE,
      },
      if: 'github.event_name == \'schedule\'',
      steps: [
        WorkflowActionsX.checkout({ 'fetch-depth': 0 }),
        ...WorkflowActionsX.setupPnpmSteps({}),
        {
          name: 'Prune expired previews',
          env: {
            GH_TOKEN: '${{ github.token }}',
          },
          run: this.generatePrunePreviewsScript(),
        },
      ],
    });

    return workflow;
  }

  private generateBuildPreviewScript(): string {
    const buildCmd = this.options.buildPreviewCommand;
    const basePath = this.options.previewsBasePath;
    const outDir = this.options.previewOutputDir;
    const lines = [
      'PR_NUMBER=${{ github.event.pull_request.number }}',
      'pnpm exec tsc && ' + buildCmd + ' --base=' + basePath + '/pr-$PR_NUMBER/ --outDir ' + outDir,
      'echo "build_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$GITHUB_OUTPUT"',
    ];
    return lines.join('\n');
  }

  private generatePublishPreviewScript(): string {
    const branch = this.options.previewsBranch;
    const outDir = this.options.previewOutputDir;
    const basePath = this.options.previewsBasePath;
    const lines = [
      'REPO_URL="https://x-access-token:\${GH_TOKEN}@github.com/\${GITHUB_REPOSITORY}.git"',
      'PUSHED=false',
      'for attempt in 1 2 3 4 5; do',
      '  rm -rf preview-site',
      '  if git ls-remote --exit-code --heads "$REPO_URL" ' + branch + ' > /dev/null 2>&1; then',
      '    git clone --depth 1 --single-branch --branch ' + branch + ' "$REPO_URL" preview-site',
      '  else',
      '    mkdir -p preview-site',
      '    git -C preview-site init -b ' + branch,
      '    git -C preview-site remote add origin "$REPO_URL"',
      '  fi',
      '  rm -rf "preview-site/pr-$PR_NUMBER"',
      '  mkdir -p "preview-site/pr-$PR_NUMBER"',
      '  cp -r ' + outDir + '/. "preview-site/pr-$PR_NUMBER"',
      '  date +%s > "preview-site/pr-$PR_NUMBER/.preview-updated"',
      '  echo "url=https://\${GITHUB_REPOSITORY_OWNER}.github.io/\${GITHUB_REPOSITORY#*/}' + basePath + '/pr-$PR_NUMBER/" >> "$GITHUB_OUTPUT"',
      '  git -C preview-site config user.name "github-actions[bot]"',
      '  git -C preview-site config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
      '  git -C preview-site add -A',
      '  if git -C preview-site diff --cached --quiet; then',
      '    PUSHED=true',
      '    break',
      '  fi',
      '  git -C preview-site commit -m "preview: pr-$PR_NUMBER"',
      '  if git -C preview-site push origin ' + branch + '; then',
      '    PUSHED=true',
      '    break',
      '  fi',
      '  echo "Previews branch moved concurrently, retrying (attempt $attempt)"',
      '  sleep $((attempt * 10))',
      'done',
      'if [ "$PUSHED" != "true" ]; then',
      '  echo "Failed to publish previews branch" >&2',
      '  exit 1',
      'fi',
    ];
    return lines.join('\n');
  }

  private generateRemovePreviewScript(): string {
    const branch = this.options.previewsBranch;
    const lines = [
      'REPO_URL="https://x-access-token:\${GH_TOKEN}@github.com/\${GITHUB_REPOSITORY}.git"',
      'PUSHED=false',
      'for attempt in 1 2 3 4 5; do',
      '  rm -rf preview-site',
      '  if git ls-remote --exit-code --heads "$REPO_URL" ' + branch + ' > /dev/null 2>&1; then',
      '    git clone --depth 1 --single-branch --branch ' + branch + ' "$REPO_URL" preview-site',
      '  else',
      '    mkdir -p preview-site',
      '    git -C preview-site init -b ' + branch,
      '    git -C preview-site remote add origin "$REPO_URL"',
      '  fi',
      '  rm -rf "preview-site/pr-$PR_NUMBER"',
      '  git -C preview-site config user.name "github-actions[bot]"',
      '  git -C preview-site config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
      '  git -C preview-site add -A',
      '  if git -C preview-site diff --cached --quiet; then',
      '    exit 0',
      '  fi',
      '  git -C preview-site commit -m "preview: remove pr-$PR_NUMBER"',
      '  if git -C preview-site push origin ' + branch + '; then',
      '    PUSHED=true',
      '    break',
      '  fi',
      '  echo "Previews branch moved concurrently, retrying (attempt $attempt)"',
      '  sleep $((attempt * 10))',
      'done',
      'if [ "$PUSHED" != "true" ]; then',
      '  echo "Failed to publish previews branch" >&2',
      '  exit 1',
      'fi',
    ];
    return lines.join('\n');
  }

  private generatePrunePreviewsScript(): string {
    const branch = this.options.previewsBranch;
    const expiry = this.options.previewExpirySeconds;
    const lines = [
      'REPO_URL="https://x-access-token:\${GH_TOKEN}@github.com/\${GITHUB_REPOSITORY}.git"',
      'PUSHED=false',
      'for attempt in 1 2 3 4 5; do',
      '  rm -rf preview-site',
      '  if git ls-remote --exit-code --heads "$REPO_URL" ' + branch + ' > /dev/null 2>&1; then',
      '    git clone --depth 1 --single-branch --branch ' + branch + ' "$REPO_URL" preview-site',
      '  else',
      '    mkdir -p preview-site',
      '    git -C preview-site init -b ' + branch,
      '    git -C preview-site remote add origin "$REPO_URL"',
      '  fi',
      '  NOW=$(date +%s)',
      '  EXPIRY=' + expiry,
      '  for stamp in preview-site/pr-*/.preview-updated; do',
      '    [ -f "$stamp" ] || continue',
      '    UPDATED=$(cat "$stamp")',
      '    if [ $((NOW - UPDATED)) -ge $EXPIRY ]; then',
      '      echo "Pruning $(dirname "$stamp") (last updated $(date -u -d "@$UPDATED" +%Y-%m-%dT%H:%MZ))"',
      '      rm -rf "$(dirname "$stamp")"',
      '    fi',
      '  done',
      '  git -C preview-site config user.name "github-actions[bot]"',
      '  git -C preview-site config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
      '  git -C preview-site add -A',
      '  if git -C preview-site diff --cached --quiet; then',
      '    exit 0',
      '  fi',
      '  git -C preview-site commit -m "preview: prune expired previews"',
      '  if git -C preview-site push origin ' + branch + '; then',
      '    PUSHED=true',
      '    break',
      '  fi',
      '  echo "Previews branch moved concurrently, retrying (attempt $attempt)"',
      '  sleep $((attempt * 10))',
      'done',
      'if [ "$PUSHED" != "true" ]; then',
      '  echo "Failed to publish previews branch" >&2',
      '  exit 1',
      'fi',
    ];
    return lines.join('\n');
  }

  private generateCommentPreviewUrlScript(): string {
    const lines = [
      "MARKER='<!-- preview-environment -->'",
      'export MARKER',
      'BODY=$(cat <<EOF',
      'Preview environment for PR #\${PR_NUMBER}: \${PREVIEW_URL}',
      '',
      '- Commit: [\${COMMIT_SHA:0:7}](\${GITHUB_SERVER_URL}/\${GITHUB_REPOSITORY}/commit/\${COMMIT_SHA})',
      '- Built at: \${BUILD_TIME} (UTC)',
      '',
      '\${MARKER}',
      'EOF',
      ')',
      'COMMENT_ID=$(gh api "repos/\${GITHUB_REPOSITORY}/issues/\${PR_NUMBER}/comments" --paginate --jq \'.[] | select(.body | contains($ENV.MARKER)) | .id\' | head -n 1)',
      'if [ -n "$COMMENT_ID" ]; then',
      '  gh api -X PATCH "repos/\${GITHUB_REPOSITORY}/issues/comments/\${COMMENT_ID}" -f body="$BODY" > /dev/null',
      'else',
      '  gh api -X POST "repos/\${GITHUB_REPOSITORY}/issues/\${PR_NUMBER}/comments" -f body="$BODY" > /dev/null',
      'fi',
    ];
    return lines.join('\n');
  }
}
