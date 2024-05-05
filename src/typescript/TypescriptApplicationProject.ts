import { JsonPatch } from 'projen';
import { GithubCredentials } from 'projen/lib/github';
import { AppPermission } from 'projen/lib/github/workflows-model';
import { NodePackageManager, TypeScriptCompilerOptions, UpgradeDependenciesSchedule } from 'projen/lib/javascript';
import { TypeScriptProject, TypeScriptProjectOptions } from 'projen/lib/typescript';
import { CustomGitignore, CustomGitignoreProps } from '../git';
import { DEFAULT_PULL_REQUEST_LINT_OPTIONS, nodeVersion, WorkflowActionsX } from '../github';

export type TypescriptApplicationProjectOptions = Omit<TypeScriptProjectOptions, 'defaultReleaseBranch'>
& Partial<Pick<TypeScriptProjectOptions, 'defaultReleaseBranch'>> & CustomProps;

type CustomProps = {
  customGitignore?: CustomGitignoreProps;
  /**
   * Release rank of this application / library
   * Used to define the day of the auto upgrade workflow
   * @default 2 (1st day of the month)
   **/
  releaseRank?: number;
  nodeVersion?: string;
}

export class TypescriptApplicationProject extends TypeScriptProject {
  static readonly DEFAULT_UPGRADE_WORKFLOW_LABELS: string[] = ['dependencies'];
  static readonly DEFAULT_JEST_CONFIG_TEST_MATCH: string[] = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];
  static readonly DEFAULT_TS_COMPILER_CONFIG: TypeScriptCompilerOptions = { skipLibCheck: true, noUnusedLocals: false };

  constructor(options: TypescriptApplicationProjectOptions) {
    const typescriptProjectOptions: TypeScriptProjectOptions = {
      defaultReleaseBranch: 'main',
      projenrcTs: true,
      sampleCode: false,
      packageManager: NodePackageManager.PNPM,
      pnpmVersion: '9',
      workflowNodeVersion: nodeVersion(options),
      ...options,
      githubOptions: {
        pullRequestLintOptions: DEFAULT_PULL_REQUEST_LINT_OPTIONS,
        mergify: false,
        projenCredentials: GithubCredentials.fromApp({
          permissions: {
            pullRequests: AppPermission.WRITE,
            contents: AppPermission.WRITE,
            workflows: AppPermission.WRITE,
          },
        }),
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
        target: 'latest',
        ...(options.depsUpgradeOptions ?? {}),
        workflowOptions: {
          labels: TypescriptApplicationProject.DEFAULT_UPGRADE_WORKFLOW_LABELS,
          schedule: UpgradeDependenciesSchedule.expressions([
            `0 0 ${((options.releaseRank ?? 2) - 1) * 2 + 1} * *`,
          ]),
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
    this.npmrc.addRegistry('https://npm.pkg.github.com', '@gplassard');
    this.npmrc.addConfig('use-node-version', nodeVersion(options));
    // we get it through a transitive dependency to @gplassard/projen-extensions, maybe should be a peer dependency instead
    new CustomGitignore(this, options.customGitignore);

    if (typescriptProjectOptions.jestOptions?.configFilePath) {
      const jestConfig = this.tryFindObjectFile(typescriptProjectOptions.jestOptions?.configFilePath);
      jestConfig?.addOverride('testMatch', typescriptProjectOptions.jestOptions.jestConfig?.testMatch ?? TypescriptApplicationProject.DEFAULT_JEST_CONFIG_TEST_MATCH);
    }

    // TODO refactor
    this.tryFindObjectFile('.github/workflows/build.yml')?.patch(
      JsonPatch.add('/jobs/build/permissions/packages', 'read'),
      JsonPatch.replace('/jobs/build/steps/2', WorkflowActionsX.setupNode(options)),
      JsonPatch.add('/jobs/build/steps/3/env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }),
    );

    this.tryFindObjectFile('.github/workflows/release.yml')?.patch(
      JsonPatch.add('/jobs/release/permissions/packages', 'read'),
      JsonPatch.replace('/jobs/release/steps/3', WorkflowActionsX.setupNode(options)),
      JsonPatch.add('/jobs/release/steps/4/env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }),
      JsonPatch.add('/jobs/release_github/steps/0/with/node-version', nodeVersion(options)),
    );

    this.tryFindObjectFile('.github/workflows/upgrade-main.yml')?.patch(
      JsonPatch.add('/jobs/upgrade/permissions/packages', 'read'),
      JsonPatch.replace('/jobs/upgrade/steps/2', WorkflowActionsX.setupNode(options)),
      JsonPatch.add('/jobs/upgrade/steps/3/env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }),
      JsonPatch.add('/jobs/upgrade/steps/4/env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }),
      JsonPatch.add('/jobs/pr/permissions/pull-requests', 'write'),
      JsonPatch.add('/jobs/pr/permissions/contents', 'write'),
      JsonPatch.add('/jobs/pr/steps/0/with/token', '${{ secrets.GITHUB_TOKEN }}'),
    );

    this.tryFindObjectFile('package.json')?.addOverride('volta.node', nodeVersion(options));
  }
}
