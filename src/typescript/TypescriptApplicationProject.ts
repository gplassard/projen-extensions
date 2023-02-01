import { JsonPatch } from 'projen';
import { GithubCredentials } from 'projen/lib/github';
import { TypeScriptCompilerOptions, UpgradeDependenciesSchedule } from 'projen/lib/javascript';
import { TypeScriptProject, TypeScriptProjectOptions } from 'projen/lib/typescript';
import { CustomGitignore, CustomGitignoreProps } from '../git/CustomGitignore';

export type TypescriptApplicationProjectOptions = Omit<TypeScriptProjectOptions, 'defaultReleaseBranch'>
& Partial<Pick<TypeScriptProjectOptions, 'defaultReleaseBranch'>> & {customGitignore?: CustomGitignoreProps};

export class TypescriptApplicationProject extends TypeScriptProject {
  static readonly DEFAULT_UPGRADE_WORKFLOW_LABELS: string[] = ['dependencies'];
  static readonly DEFAULT_JEST_CONFIG_TEST_MATCH: string[] = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];
  static readonly DEFAULT_TS_COMPILER_CONFIG: TypeScriptCompilerOptions = { skipLibCheck: true, noUnusedLocals: false };

  constructor(options: TypescriptApplicationProjectOptions) {
    const typescriptProjectOptions: TypeScriptProjectOptions = {
      defaultReleaseBranch: 'main',
      projenrcTs: true,
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
      tsconfig: {
        ...(options.tsconfig ?? {}),
        compilerOptions: {
          ...TypescriptApplicationProject.DEFAULT_TS_COMPILER_CONFIG,
          ...(options.tsconfig?.compilerOptions ?? {}),
        },
      },
    };
    super(typescriptProjectOptions);
    new CustomGitignore(this, options.customGitignore);

    if (typescriptProjectOptions.jestOptions?.configFilePath) {
      const jestConfig = this.tryFindObjectFile(typescriptProjectOptions.jestOptions?.configFilePath);
      jestConfig?.addOverride('testMatch', typescriptProjectOptions.jestOptions.jestConfig?.testMatch ?? TypescriptApplicationProject.DEFAULT_JEST_CONFIG_TEST_MATCH);
    }

    // TODO refactor
    this.tryFindObjectFile('.github/workflows/build.yml')?.addOverride('jobs.build.permissions.packages', 'read');
    this.tryFindObjectFile('.github/workflows/build.yml')?.addOverride('jobs.build.steps.1.env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' });
    this.tryFindObjectFile('.github/workflows/build.yml')?.patch(JsonPatch.add('/jobs/build/steps/1', {
      uses: 'actions/setup-node@v3',
      with: {
        'node-version': '14',
        'registry-url': 'https://npm.pkg.github.com',
        'cache': 'yarn',
      },
    }));

    this.tryFindObjectFile('.github/workflows/release.yml')?.addOverride('jobs.release.permissions.packages', 'read');
    this.tryFindObjectFile('.github/workflows/release.yml')?.addOverride('jobs.release.steps.2.env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' });
    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(JsonPatch.add('/jobs/release/steps/1', {
      uses: 'actions/setup-node@v3',
      with: {
        'node-version': '14',
        'registry-url': 'https://npm.pkg.github.com',
        'cache': 'yarn',
      },
    }));
    this.tryFindObjectFile('.github/workflows/upgrade-main.yml')?.addOverride('jobs.upgrade.permissions.packages', 'read');
    this.tryFindObjectFile('.github/workflows/upgrade-main.yml')?.addOverride('jobs.upgrade.steps.1.env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' });
    this.tryFindObjectFile('.github/workflows/upgrade-main.yml')?.addOverride('jobs.upgrade.steps.2.env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' });
    this.tryFindObjectFile('.github/workflows/upgrade-main.yml')?.patch(JsonPatch.add('/jobs/upgrade/steps/1', {
      uses: 'actions/setup-node@v3',
      with: {
        'node-version': '14',
        'registry-url': 'https://npm.pkg.github.com',
        'cache': 'yarn',
      },
    }));
    this.tryFindObjectFile('.github/workflows/upgrade-main.yml')?.addOverride('jobs.pr.permissions.pull-requests', 'write');
    this.tryFindObjectFile('.github/workflows/upgrade-main.yml')?.addOverride('jobs.pr.permissions.contents', 'write');
    this.tryFindObjectFile('.github/workflows/upgrade-main.yml')?.addOverride('jobs.pr.steps.0.with.token', '${{ secrets.GITHUB_TOKEN }}');
  }
}
