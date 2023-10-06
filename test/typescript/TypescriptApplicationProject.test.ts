import { synthSnapshot } from 'projen/lib/util/synth';
import { TypescriptApplicationProject } from '../../src';
import { NodePackageManager } from 'projen/lib/javascript';

describe('TypescriptApplicationProject with default settings', () => {
  it('synthesizes', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
    });
    const output = synthSnapshot(project);
    expect(output).toMatchSnapshot();
  });

  it('can still use yarn', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
      packageManager: NodePackageManager.YARN,
    });
    const output = synthSnapshot(project);
    expect(output).toMatchSnapshot();
  });
});
