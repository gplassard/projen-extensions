import { Project, Testing } from 'projen';
import { ProjenSynthAction } from '../../src';

describe('ProjenSynthAction', () => {
  it('synthesizes', () => {
    const project = new Project({
      name: 'test-project',
    });
    new ProjenSynthAction(project, {});

    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});