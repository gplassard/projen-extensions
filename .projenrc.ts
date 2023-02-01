import { TypescriptLibraryProject } from './src';
import { DependencyType } from 'projen';

const project = new TypescriptLibraryProject({
  name: 'projen-extensions',
  packageName: '@gplassard/projen-extensions',
  deps: ['projen'],
});
project.deps.removeDependency('@gplassard/projen-extensions');
project.deps.removeDependency('projen', DependencyType.BUILD);
project.synth();
