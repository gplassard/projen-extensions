import { DependencyType } from 'projen';
import { TypescriptLibraryProject } from './src';

const project = new TypescriptLibraryProject({
  name: 'projen-extensions',
  packageName: '@gplassard/projen-extensions',
  deps: ['projen'],
});
project.deps.removeDependency('@gplassard/projen-extensions');
project.deps.removeDependency('projen', DependencyType.BUILD);
project.synth();
