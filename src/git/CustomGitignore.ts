import { Component, Project } from 'projen';


export interface CustomGitignoreProps {
  additionalGitignore?: string[];
}

export class CustomGitignore extends Component {

  constructor(project: Project, props?: CustomGitignoreProps) {
    super(project);
    this.project.addGitIgnore('.idea');
    this.project.addGitIgnore('*.iml');
    this.project.addGitIgnore('.vscode');
    this.project.addGitIgnore('.DS_Store');
    if (props && props.additionalGitignore) {
      for (let gitignore of props.additionalGitignore) {
        this.project.addGitIgnore(gitignore);
      }
    }
  }
}
