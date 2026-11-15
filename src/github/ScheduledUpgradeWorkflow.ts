import { Component } from 'projen';
import { GitHub, GithubWorkflow, WorkflowActions, WorkflowJobs, GithubCredentials } from 'projen/lib/github';
import { JobStep, JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from './WorkflowActionsX';

/**
 * A single upgrade step to be executed in the scheduled upgrade workflow.
 */
export interface ScheduledUpgradeStep {
  /**
   * Display name of the step.
   */
  readonly name: string;

  /**
   * Shell command to run.
   */
  readonly run: string;

  /**
   * Environment variables to set for this step.
   * @default - no additional environment variables
   */
  readonly env?: Record<string, string>;
}

/**
 * Options for the ScheduledUpgradeWorkflow component.
 */
export interface ScheduledUpgradeWorkflowOptions {
  /**
   * Name of the workflow file (without .yml extension).
   * @default 'scheduled-upgrade'
   */
  readonly workflowName?: string;

  /**
   * Cron expression for the schedule.
   * @default '0 0 1 * *' (first day of every month at midnight)
   */
  readonly cronSchedule?: string;

  /**
   * Upgrade steps to execute. Each step is an inline command with an optional name and environment.
   */
  readonly upgradeSteps: ScheduledUpgradeStep[];

  /**
   * Extra job steps to run before the upgrade steps (e.g. apt-get installs).
   * @default - no setup steps
   */
  readonly setupSteps?: JobStep[];

  /**
   * Whether to include the usual pnpm, Node.js and dependency installation
   * steps. When disabled, the caller provides everything via `setupSteps`.
   * @default true
   */
  readonly installDependencies?: boolean;

  /**
   * The maximum number of minutes to let the upgrade job run before GitHub
   * automatically cancels it.
   * @default - GitHub default (360)
   */
  readonly timeoutMinutes?: number;

  /**
   * Whether to limit concurrency of the workflow.
   * @default false
   */
  readonly limitConcurrency?: boolean;

  /**
   * Concurrency group of the workflow.
   * @default - the workflow name
   */
  readonly concurrencyGroup?: string;

  /**
   * Whether to cancel in-progress runs of the same concurrency group.
   * @default true
   */
  readonly cancelInProgress?: boolean;

  /**
   * Title of the pull request to create.
   * @default 'chore: scheduled upgrade'
   */
  readonly pullRequestTitle?: string;

  /**
   * Description added to the pull request.
   * @default 'Automated scheduled upgrade.'
   */
  readonly pullRequestDescription?: string;

  /**
   * Labels to apply to the pull request.
   * @default ['dependencies']
   */
  readonly labels?: string[];

  /**
   * Credentials used to create the pull request.
   * @default - uses GitHub App credentials
   */
  readonly credentials?: GithubCredentials;

  /**
   * Runner labels for the upgrade job.
   * @default ['ubuntu-latest']
   */
  readonly runsOn?: string[];

  /**
   * Whether to enable manual workflow dispatch.
   * @default true
   */
  readonly workflowDispatch?: boolean;

  /**
   * Additional environment variables for all upgrade steps.
   * @default - only GH_TOKEN is set
   */
  readonly commonEnv?: Record<string, string>;
}

/**
 * A reusable workflow component that creates a scheduled job, runs
 * customizable work steps (e.g. dependency upgrades or data refresh
 * pipelines) and opens a pull request with the changes.
 *
 * This wraps the common pattern of:
 * 1. Checkout and setup environment
 * 2. Run a series of commands (with optional setup steps)
 * 3. Upload a git patch artifact
 * 4. Create a pull request from the patch
 */
export class ScheduledUpgradeWorkflow extends Component {
  constructor(scope: GitHub, options: ScheduledUpgradeWorkflowOptions) {
    super(scope, 'scheduled-upgrade-workflow');

    const workflowName = options.workflowName ?? 'scheduled-upgrade';
    const cronSchedule = options.cronSchedule ?? '0 0 1 * * *';
    const runsOn = options.runsOn ?? ['ubuntu-latest'];
    const workflowDispatch = options.workflowDispatch ?? true;
    const credentials = options.credentials ?? GithubCredentials.fromApp();
    const commonEnv = options.commonEnv ?? {};
    const installDependencies = options.installDependencies ?? true;

    const workflow = new GithubWorkflow(scope, workflowName, {
      limitConcurrency: options.limitConcurrency ?? false,
      concurrencyOptions: {
        group: options.concurrencyGroup ?? workflowName,
        cancelInProgress: options.cancelInProgress ?? true,
      },
    });

    // Triggers: schedule + optional manual dispatch
    const triggers: Record<string, unknown> = {
      schedule: [{ cron: cronSchedule }],
    };
    if (workflowDispatch) {
      triggers.workflowDispatch = {};
    }
    workflow.on(triggers);

    // Build the upgrade steps as job steps
    const upgradeJobSteps = [
      WorkflowActionsX.checkout({}),
      ...(installDependencies ? WorkflowActionsX.setupPnpmSteps({}) : []),
      ...(options.setupSteps ?? []),
      ...options.upgradeSteps.map(step => ({
        name: step.name,
        run: step.run,
        env: {
          GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
          ...commonEnv,
          ...step.env,
        },
      })),
      ...WorkflowActions.uploadGitPatch({
        stepId: 'create_patch',
        outputName: 'patch_created',
      }),
    ];

    // Upgrade job
    workflow.addJob('upgrade', {
      name: 'Upgrade',
      runsOn,
      ...(options.timeoutMinutes ? { timeoutMinutes: options.timeoutMinutes } : {}),
      outputs: {
        patch_created: {
          outputName: 'patch_created',
          stepId: 'create_patch',
        },
      },
      permissions: {
        contents: JobPermission.READ,
        packages: JobPermission.READ,
      },
      steps: upgradeJobSteps,
    });

    // PR job
    workflow.addJob('pr', {
      ...WorkflowJobs.pullRequestFromPatch({
        credentials,
        patch: {
          jobId: 'upgrade',
          outputName: 'patch_created',
        },
        workflowName,
        pullRequestTitle: options.pullRequestTitle ?? 'chore: scheduled upgrade',
        pullRequestDescription: options.pullRequestDescription ?? 'Automated scheduled upgrade.',
        labels: options.labels ?? ['dependencies'],
      }),
      permissions: {
        contents: JobPermission.WRITE,
        pullRequests: JobPermission.WRITE,
      },
    });
  }
}
