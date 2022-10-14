import { GithubCredentials } from 'projen/lib/github';
import { UpgradeDependenciesSchedule } from 'projen/lib/javascript';
import { TypeScriptProject } from 'projen/lib/typescript';

const project = new TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'projen-extensions',
  projenrcTs: true,
  githubOptions: {
    mergify: false,
    projenCredentials: GithubCredentials.fromPersonalAccessToken({ secret: 'GITHUB_TOKEN' }),
  },
  gitignore: ['*.iml', '.idea', '.vscode'],
  sampleCode: false,
  packageName: '@gplassard/projen-extensions',
  jestOptions: {
    configFilePath: 'jest.config.json',
  },
  publishTasks: true,
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['dependencies'],
      schedule: UpgradeDependenciesSchedule.MONTHLY,
    },
  },
  releaseToNpm: true,
  npmRegistryUrl: 'https://npm.pkg.github.com',
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
});
project.synth();
