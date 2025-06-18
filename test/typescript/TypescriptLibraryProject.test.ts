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
    expect(output).toMatchSnapshot();
  });
});
