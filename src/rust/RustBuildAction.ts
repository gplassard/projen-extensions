import { Component, Project, YamlFile } from 'projen';
import { CARGO_TEST, cargoBuild, cargoCaches } from './utils';
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
              cargoBuild(),
              CARGO_TEST,
              ...cargoCaches(),
            ],
          },
        },
      },
    });

  }
}
