import { Testing } from 'projen';
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
