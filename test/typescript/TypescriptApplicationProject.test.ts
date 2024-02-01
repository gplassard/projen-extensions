import { NodePackageManager } from 'projen/lib/javascript';
import { TypescriptApplicationProject } from '../../src';
import { Testing } from 'projen';

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
