import { Component, Project, YamlFile } from 'projen';
import { buildTask, checkoutTask, testsTask } from './common';

export interface RustBuildActionsProps {

}
export class RustBuildActions extends Component {

  constructor(project: Project, _props?: RustBuildActionsProps) {
    super(project);

    new YamlFile(project, '.github/workflows/rust-build.yml', {
      obj: {
        name: 'ci',
        on: {
          push: {
            branches: ['master'],
          },
          pull_request: {
            types: ['opened', 'edited', 'synchronize', 'reopened'],
            branches: ['master'],
          },
        },
        env: {
          CARGO_TERM_COLOR: 'always',
        },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            'steps': [
              checkoutTask,
              buildTask,
              testsTask,
            ],
          },
        },
      },
    });
  }
}
