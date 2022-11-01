import { synthSnapshot } from 'projen/lib/util/synth';
import { TypescriptApplicationProject } from '../../src';

describe('TypescriptApplicationProject with default settings', () => {
  it('synthesizes', () => {
    const project = new TypescriptApplicationProject({
      name: 'test-project',
    });
    const output = synthSnapshot(project);
    expect(output).toMatchSnapshot();
  });
});
