import { Testing } from 'projen';
import { describe, it, expect } from 'vitest';
import { GoProject } from '../../src';

describe('GoProject with default settings', () => {
  it('synthesizes', () => {
    const project = new GoProject({
      name: 'test-project',
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});

describe('GoProject with custom versions', () => {
  it('synthesizes', () => {
    const project = new GoProject({
      name: 'test-project-custom-versions',
      goBuildWorkflowOptions: {
        goVersion: '1.22',
      },
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});
