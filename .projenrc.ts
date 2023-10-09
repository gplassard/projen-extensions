import { TypescriptLibraryProject } from './src';

const project = new TypescriptLibraryProject({
  name: 'projen-extensions',
  packageName: '@gplassard/projen-extensions',
  deps: ['projen'],
  disableGplassardRegistry: true,
  releaseRank: 1,
});
project.deps.removeDependency('@gplassard/projen-extensions');
project.synth();
