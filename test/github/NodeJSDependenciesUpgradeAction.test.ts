import { Project, Testing } from 'projen';
import { NodeJSDependenciesUpgradeAction } from '../../src';

describe('NodeJSDependenciesUpgradeAction', () => {
  it('synthesizes', () => {
    const project = new Project({
      name: 'test-project',
    });
    new NodeJSDependenciesUpgradeAction(project, {});

    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});