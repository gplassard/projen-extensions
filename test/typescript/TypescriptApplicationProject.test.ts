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
        buildCommand: 'pnpm run build:prod',
        artifactPath: './custom-dist',
      },
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();

    // Verify both workflows are generated
    expect(output['.github/workflows/deploy-website.yml']).toBeDefined();
    expect(output['.github/workflows/preview-website.yml']).toBeDefined();

    // Verify the deploy workflow includes the preview step and custom options
    const deployWorkflow = output['.github/workflows/deploy-website.yml'];
    expect(deployWorkflow).toContain('Include preview environments');
    expect(deployWorkflow).toContain('pnpm run build:prod');

    // Verify the preview workflow has the expected jobs and steps
    const previewWorkflow = output['.github/workflows/preview-website.yml'];
    expect(previewWorkflow).toContain('preview:');
    expect(previewWorkflow).toContain('cleanup:');
    expect(previewWorkflow).toContain('prune:');

    // Verify environment name evaluation
    expect(previewWorkflow).toContain('name: preview-pr-${{ github.event.pull_request.number }}');

    // Verify base path prefix for Vite preview build and comment url
    expect(previewWorkflow).toContain('--base=/${GITHUB_REPOSITORY#*/}/previews/pr-$PR_NUMBER/');
    expect(previewWorkflow).toContain('https://${GITHUB_REPOSITORY_OWNER}.github.io/${GITHUB_REPOSITORY#*/}/previews/pr-$PR_NUMBER/');

    // Verify GitHub Pages deployment in preview workflow with forwarded build command and artifact path
    expect(previewWorkflow).toContain('pnpm run build:prod');
    expect(previewWorkflow).toContain('path: ./custom-dist');
    expect(previewWorkflow).toContain('uses: actions/deploy-pages@');
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
