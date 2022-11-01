import { synthSnapshot } from 'projen/lib/util/synth';
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
    const output = synthSnapshot(project);
    expect(output).toMatchSnapshot();
  });
});
