import { synthSnapshot } from 'projen/lib/util/synth';
import { TypescriptLibraryProject } from '../../src';

describe('TypescriptLibraryProject with default settings', () => {
  it('synthesizes', () => {
    const project = new TypescriptLibraryProject({
      name: 'test-project',
      packageName: 'test-project-package-name',
    });
    const output = synthSnapshot(project);
    expect(output).toMatchSnapshot();
  });
});
