import { Testing } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript';
import { describe, it, expect } from 'vitest';
import { TypescriptApplicationProject } from '../../src';

describe('TypescriptApplicationProject with default settings', () => {
  it('synthesizes', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();

    const upgradeWorkflow = output['.github/workflows/upgrade.yml'];
    expect(upgradeWorkflow).toContain('NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
  });

  it('supports options', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
      agentConfigurationEnabled: true,
      deployGithubPagesWorkflowEnabled: true,
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });

  it('creates preview workflow when includePreviews is enabled', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
      deployGithubPagesWorkflowEnabled: true,
      deployGithubPagesWorkflowOptions: {
        includePreviews: true,
      },
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();

    // Verify both workflows are generated
    expect(output['.github/workflows/deploy-website.yml']).toBeDefined();
    expect(output['.github/workflows/preview-website.yml']).toBeDefined();

    // Verify the deploy workflow includes the preview step
    expect(output['.github/workflows/deploy-website.yml']).toContain('Include preview environments');

    // Verify the preview workflow has the expected jobs
    const previewWorkflow = output['.github/workflows/preview-website.yml'];
    expect(previewWorkflow).toContain('preview:');
    expect(previewWorkflow).toContain('cleanup:');
    expect(previewWorkflow).toContain('prune:');
  });

  it('can still use yarn', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
      packageManager: NodePackageManager.YARN_CLASSIC,
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });

  it('can work with release', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
      release: true,
    });
    const output = Testing.synth(project);

    const upgradeWorkflow = output['.github/workflows/upgrade-main.yml'];
    expect(upgradeWorkflow).toContain('NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    expect(output).toMatchSnapshot();
  });
});
