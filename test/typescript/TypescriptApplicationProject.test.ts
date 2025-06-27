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
  });

  it('can still use yarn', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
      packageManager: NodePackageManager.YARN_CLASSIC,
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});
