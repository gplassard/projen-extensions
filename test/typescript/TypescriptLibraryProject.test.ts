import { Testing } from 'projen';
import { describe, it, expect } from 'vitest';
import { TypescriptLibraryProject } from '../../src';

describe('TypescriptLibraryProject with default settings', () => {
  it('synthesizes', () => {
    const project = new TypescriptLibraryProject({
      name: 'test-project',
      packageName: 'test-project-package-name',
    });
    const output = Testing.synth(project);
    const releaseWorkflow = output['.github/workflows/release.yml'];
    expect(releaseWorkflow).toContain('Publish to npm');
    expect(releaseWorkflow).toContain('path: build-artifact');
    expect(releaseWorkflow).toContain('merge-multiple: true');
    expect(output).toMatchSnapshot();
  });
});
