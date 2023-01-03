import { Component, Project, TomlFile } from 'projen';

export interface CargoProps {
  package: {
    version: string;
    authors: string[];
    edition: '2021';
  };
  dependencies: Record<string, string>;
}

export class Cargo extends Component {

  constructor(project: Project, props: CargoProps) {
    super(project);

    new TomlFile(project, 'cargo.toml', {
      obj: {
        ...props,
        package: {
          ...props.package,
          name: project.name,
        },
      },
    });
    project.gitignore.addPatterns('target');
  }
}
