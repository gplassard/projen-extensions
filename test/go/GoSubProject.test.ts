import { Testing } from 'projen';
import { describe, it, expect } from 'vitest';
import { GoProject, BaseProject } from '../../src';

describe('GoProject as subproject', () => {
  it('synthesizes when added to a BaseProject', () => {
    const root = new BaseProject({
      name: 'root-project',
    });
    new GoProject({
      name: 'sub-project',
      parent: root,
      outdir: 'sub-project',
    });
    const output = Testing.synth(root);
    expect(output['.github/workflows/build-sub-project.yml']).toBeDefined();
    expect(output['.github/workflows/lint-sub-project.yml']).toBeDefined();

    const buildWorkflow = output['.github/workflows/build-sub-project.yml'];
    expect(buildWorkflow).toContain('name: Build sub-project');
    expect(buildWorkflow).toContain('working-directory: sub-project');
    expect(buildWorkflow).toContain('path: sub-project/repo.patch');

    const lintWorkflow = output['.github/workflows/lint-sub-project.yml'];
    expect(lintWorkflow).toContain('name: Lint sub-project');
    expect(lintWorkflow).toContain('working-directory: sub-project');

    expect(output).toMatchSnapshot();
  });
});
