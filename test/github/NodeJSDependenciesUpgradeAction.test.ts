import { Project, Testing } from 'projen';
import { GitHub } from 'projen/lib/github';
import { NodeJSDependenciesUpgradeAction } from '../../src';

describe('NodeJSDependenciesUpgradeAction', () => {
  it('synthesizes', () => {
    const project = new Project({
      name: 'test-project',
    });
    const github = new GitHub(project, { pullRequestLint: false });
    new NodeJSDependenciesUpgradeAction(github, {});

    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});