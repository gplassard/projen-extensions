import { Component, Project, TextFile } from 'projen';

export interface NpmrcProps {
}
export class Npmrc extends Component {

  constructor(project: Project, _props?: NpmrcProps) {
    super(project);

    new TextFile(project, '.npmrc', {
      lines: [
        '@gplassard:registry=https://npm.pkg.github.com',
      ],
    });
  }
}
