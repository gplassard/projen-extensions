import { Project, Testing } from 'projen';
import { GitHub } from 'projen/lib/github';
import { describe, it, expect } from 'vitest';
import { ScheduledUpgradeWorkflow } from '../../src';

describe('ScheduledUpgradeWorkflow', () => {
  it('synthesizes with defaults', () => {
    const project = new Project({ name: 'test-project' });
    const github = new GitHub(project, { pullRequestLint: false });
    new ScheduledUpgradeWorkflow(github, {
      upgradeSteps: [
        { name: 'Update dependencies', run: 'pnpm update' },
      ],
    });

    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();

    const workflow = output['.github/workflows/scheduled-upgrade.yml'];
    expect(workflow).toBeDefined();
    expect(workflow).toContain('cron: 0 0 1 * * *');
    expect(workflow).toContain('workflow_dispatch: {}');
    expect(workflow).not.toContain('concurrency');
    expect(workflow).toContain('Install dependencies');
    expect(workflow).toContain('patch_created');
    expect(workflow).toContain('Create Pull Request');
  });

  it('synthesizes a data refresh pipeline with a full configuration', () => {
    const project = new Project({ name: 'test-project' });
    const github = new GitHub(project, { pullRequestLint: false });
    new ScheduledUpgradeWorkflow(github, {
      workflowName: 'update-data',
      cronSchedule: '0 4 * * 1',
      upgradeSteps: [
        { name: 'Prepare data', run: 'pnpm run data', env: { TIPPECANOE_MAX_ZOOM: '14' } },
      ],
      setupSteps: [
        { name: 'Setup pnpm', run: 'curl -fsSL https://get.pnpm.io/install.sh | sh -' },
        { name: 'Install tippecanoe', run: 'sudo apt-get install -y tippecanoe' },
      ],
      installDependencies: false,
      timeoutMinutes: 30,
      limitConcurrency: true,
      concurrencyGroup: 'update-data',
      cancelInProgress: true,
      runsOn: ['ubuntu-24.04'],
      pullRequestTitle: 'chore(data): refresh prepared data',
      pullRequestDescription: ' Automated data refresh.',
      labels: ['data-refresh'],
    });

    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();

    const workflow = output['.github/workflows/update-data.yml'];
    expect(workflow).toBeDefined();
    expect(workflow).toContain('cron: 0 4 * * 1');
    expect(workflow).toContain('workflow_dispatch: {}');
    expect(workflow).toContain('ubuntu-24.04');
    expect(workflow).toContain('timeout-minutes: 30');
    expect(workflow).toContain('group: update-data');
    expect(workflow).toContain('cancel-in-progress: true');
    expect(workflow).toContain('Install tippecanoe');
    expect(workflow).toContain('Setup pnpm');
    expect(workflow).toContain('TIPPECANOE_MAX_ZOOM: "14"');
    expect(workflow).not.toContain('Install dependencies');
    expect(workflow).toContain('pnpm run data');
    expect(workflow).toContain('patch_created');
    expect(workflow).toContain('chore(data): refresh prepared data');
    expect(workflow).toContain('Create Pull Request');
    expect(workflow).not.toContain('git push');
  });

  it('omits workflow dispatch when disabled', () => {
    const project = new Project({ name: 'test-project' });
    const github = new GitHub(project, { pullRequestLint: false });
    new ScheduledUpgradeWorkflow(github, {
      cronSchedule: '0 0 * * *',
      workflowDispatch: false,
      upgradeSteps: [
        { name: 'Update dependencies', run: 'pnpm update' },
      ],
    });

    const output = Testing.synth(project);
    const workflow = output['.github/workflows/scheduled-upgrade.yml'];
    expect(workflow).toBeDefined();
    expect(workflow).not.toContain('workflow_dispatch');
    expect(workflow).toContain('cron: 0 0 * * *');
  });
});
