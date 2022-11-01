import { GithubCredentials } from 'projen/lib/github';
import { UpgradeDependenciesSchedule } from 'projen/lib/javascript';
import { TypeScriptProject, TypeScriptProjectOptions } from 'projen/lib/typescript';

export type TypescriptApplicationProjectOptions = Omit<TypeScriptProjectOptions, 'defaultReleaseBranch'>
& Partial<Pick<TypeScriptProjectOptions, 'defaultReleaseBranch'>>;

export class TypescriptApplicationProject extends TypeScriptProject {
  static readonly DEFAULT_GITIGNORE: string[] = ['*.iml', '.idea', '.vscode'];
  static readonly DEFAULT_UPGRADE_WORKFLOW_LABELS: string[] = ['dependencies'];
  static readonly DEFAULT_JEST_CONFIG_TEST_MATCH: string[] = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];

  constructor(options: TypescriptApplicationProjectOptions) {
    const typescriptProjectOptions: TypeScriptProjectOptions = {
      defaultReleaseBranch: 'main',
      projenrcTs: true,
      gitignore: TypescriptApplicationProject.DEFAULT_GITIGNORE,
      sampleCode: false,
      ...options,
      githubOptions: {
        mergify: false,
        projenCredentials: GithubCredentials.fromPersonalAccessToken({ secret: 'GITHUB_TOKEN' }),
        ...(options.githubOptions ?? {}),
      },
      jestOptions: {
        configFilePath: 'jest.config.json',
        jestConfig: {
          testMatch: TypescriptApplicationProject.DEFAULT_JEST_CONFIG_TEST_MATCH,
          ...(options.jestOptions?.jestConfig ?? {}),
        },
        ...(options.jestOptions ?? {}),
      },
      depsUpgradeOptions: {
        ...(options.depsUpgradeOptions ?? {}),
        workflowOptions: {
          labels: TypescriptApplicationProject.DEFAULT_UPGRADE_WORKFLOW_LABELS,
          schedule: UpgradeDependenciesSchedule.MONTHLY,
          ...(options.depsUpgradeOptions?.workflowOptions ?? {}),
        },
      },
      devDeps: ['@gplassard/projen-extensions', ...(options.devDeps ?? [])],
    };
    super(typescriptProjectOptions);

    if (typescriptProjectOptions.jestOptions?.configFilePath) {
      const jestConfig = this.tryFindObjectFile(typescriptProjectOptions.jestOptions?.configFilePath);
      jestConfig?.addOverride('testMatch', typescriptProjectOptions.jestOptions.jestConfig?.testMatch ?? TypescriptApplicationProject.DEFAULT_JEST_CONFIG_TEST_MATCH);
    }
    const workflowInstalls = [{ file: 'build.yml', step: 'build' }, { file: 'release.yml', step: 'release' }, { file: 'upgrade-main.yml', step: 'upgrade' }];
    workflowInstalls.forEach(({ file, step }) => {
      this.tryFindObjectFile(`.github/workflows/${file}`)?.addOverride(`jobs.${step}.permissions.packages`, 'read');
    });
  }
}
