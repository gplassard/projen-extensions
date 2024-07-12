import { Component, Project, YamlFile } from 'projen';
import { CARGO_BUILD, CARGO_CACHES, CARGO_TEST, SETUP_RUST } from './utils';
import { WorkflowActionsX } from '../github';

export interface RustBuildActionProps {

}

export class RustBuildAction extends Component {

  constructor(project: Project, _props?: RustBuildActionProps) {
    super(project);

    new YamlFile(project, '.github/workflows/rust-build.yml', {
      obj: {
        name: 'ci',
        on: {
          push: {
            branches: ['main'],
          },
          pull_request: {
            types: ['opened', 'edited', 'synchronize', 'reopened'],
            branches: ['main'],
          },
        },
        env: {
          CARGO_TERM_COLOR: 'always',
        },
        jobs: {
          build: {
            'runs-on': 'ubuntu-latest',
            'steps': [
              WorkflowActionsX.checkout({}),
              SETUP_RUST,
              CARGO_BUILD,
              CARGO_TEST,
              ...CARGO_CACHES,
            ],
          },
        },
      },
    });

  }
}
