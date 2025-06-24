import { Project, Testing } from 'projen';
import { GitHub } from 'projen/lib/github';
import { describe, it, expect } from 'vitest';
import { ProjenSynthAction } from '../../src';

describe('ProjenSynthAction', () => {
  it('synthesizes', () => {
    const project = new Project({
      name: 'test-project',
    });
    const github = new GitHub(project, { pullRequestLint: false });
    new ProjenSynthAction(github, {});

    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});
