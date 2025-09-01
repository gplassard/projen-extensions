import { Testing } from 'projen';
import { describe, it, expect } from 'vitest';
import { RustProject } from '../../src';

describe('RustProject with default settings', () => {
  it('synthesizes', () => {
    const project = new RustProject({
      name: 'test-project',
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});
