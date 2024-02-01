import { TypescriptLibraryProject } from './src';

const project = new TypescriptLibraryProject({
  name: 'projen-extensions',
  packageName: '@gplassard/projen-extensions',
  deps: ['projen'],
  releaseRank: 1,
});
project.deps.removeDependency('@gplassard/projen-extensions');
project.jest?.addSetupFile('./test/jest.setup.ts');
project.synth();
