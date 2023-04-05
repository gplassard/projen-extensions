import { Component, Project } from 'projen';


export interface CustomGitignoreProps {

}

export class CustomGitignore extends Component {

  constructor(project: Project, _props?: CustomGitignoreProps) {
    super(project);
    this.project.addGitIgnore('.idea');
    this.project.addGitIgnore('*.iml');
    this.project.addGitIgnore('.vscode');
    this.project.addGitIgnore('.DS_Store');
  }
}
