import { GithubCredentials } from 'projen/lib/github';
import { UpgradeDependenciesSchedule } from 'projen/lib/javascript';
import { TypeScriptProject, TypeScriptProjectOptions } from 'projen/lib/typescript';

export type TypescriptLibraryProjectOptions = Omit<TypeScriptProjectOptions, 'defaultReleaseBranch'>
& Partial<Pick<TypeScriptProjectOptions, 'defaultReleaseBranch'>>
& Required<Pick<TypeScriptProjectOptions, 'packageName'>>;

export class TypescriptLibraryProject extends TypeScriptProject {
  static readonly DEFAULT_GITIGNORE: string[] = ['*.iml', '.idea', '.vscode'];
  static readonly DEFAULT_UPGRADE_WORKFLOW_LABELS: string[] = ['dependencies'];
  static readonly DEFAULT_JEST_CONFIG_TEST_MATCH: string[] = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];

  constructor(options: TypescriptLibraryProjectOptions) {
    const typescriptProjectOptions = {
      defaultReleaseBranch: 'main',
      projenrcTs: true,
      gitignore: TypescriptLibraryProject.DEFAULT_GITIGNORE,
      sampleCode: false,
      publishTasks: true,
      releaseToNpm: true,
      npmRegistryUrl: 'https://npm.pkg.github.com',
      ...options,
      githubOptions: {
        mergify: false,
        projenCredentials: GithubCredentials.fromPersonalAccessToken({ secret: 'GITHUB_TOKEN' }),
        ...(options.githubOptions ?? {}),
      },
      jestOptions: {
        configFilePath: 'jest.config.json',
        jestConfig: {
          testMatch: TypescriptLibraryProject.DEFAULT_JEST_CONFIG_TEST_MATCH,
          ...(options.jestOptions?.jestConfig ?? {}),
        },
        ...(options.jestOptions ?? {}),
      },
      depsUpgradeOptions: {
        ...(options.depsUpgradeOptions ?? {}),
        workflowOptions: {
          labels: TypescriptLibraryProject.DEFAULT_UPGRADE_WORKFLOW_LABELS,
          schedule: UpgradeDependenciesSchedule.MONTHLY,
          ...(options.depsUpgradeOptions?.workflowOptions ?? {}),
        },
      },
    };
    super(typescriptProjectOptions);

    const jestConfig = this.tryFindObjectFile(typescriptProjectOptions.jestOptions?.configFilePath);
    jestConfig?.addOverride('testMatch', typescriptProjectOptions.jestOptions.jestConfig?.testMatch ?? TypescriptLibraryProject.DEFAULT_JEST_CONFIG_TEST_MATCH);
  }
}
