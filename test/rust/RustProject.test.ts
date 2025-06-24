import { Testing } from 'projen';
import { describe, it, expect } from 'vitest';
import { RustProject } from '../../src';

describe('RustProject with default settings', () => {
  it('synthesizes', () => {
    const project = new RustProject({
      name: 'test-project',
      cargo: {
        package: {
          authors: ['user@mail.com'],
          edition: '2021',
          version: '1.0.0',
        },
        dependencies: {
        },
      },
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});
