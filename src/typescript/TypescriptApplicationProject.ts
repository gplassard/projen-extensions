import { JsonPatch, SampleFile } from 'projen';
import { GithubCredentials } from 'projen/lib/github';
import { AppPermission } from 'projen/lib/github/workflows-model';
import { NodePackageManager, TypeScriptCompilerOptions, UpgradeDependenciesSchedule } from 'projen/lib/javascript';
import { TypeScriptProject, TypeScriptProjectOptions } from 'projen/lib/typescript';
import { CustomGitignore, CustomGitignoreProps } from '../git';
import { DEFAULT_PULL_REQUEST_LINT_OPTIONS, nodeVersion, pnpmVersion, WorkflowActionsX } from '../github';

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
  /**
   * Allow vitest to pass when no tests are found
   * @default false
   */
  vitestPassWithNoTests?: boolean;
};

export class TypescriptApplicationProject extends TypeScriptProject {
  static readonly DEFAULT_UPGRADE_WORKFLOW_LABELS: string[] = ['dependencies'];
  static readonly DEFAULT_VITEST_CONFIG_INCLUDE: string[] = ['**/?(*.)+(spec|test).ts?(x)'];
  static readonly DEFAULT_TS_COMPILER_CONFIG: TypeScriptCompilerOptions = { skipLibCheck: true, noUnusedLocals: false };

  constructor(options: TypescriptApplicationProjectOptions) {
    const typescriptProjectOptions: TypeScriptProjectOptions = {
      defaultReleaseBranch: 'main',
      projenrcTs: true,
      sampleCode: false,
      packageManager: NodePackageManager.PNPM,
      pnpmVersion: pnpmVersion(),
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
      jestOptions: undefined,
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

    // Add Vitest configuration and remove Jest
    this.addDevDeps('vitest');
    this.deps.removeDependency('@types/jest');
    this.deps.removeDependency('jest');
    this.deps.removeDependency('ts-jest');
    this.deps.removeDependency('jest-junit');
    this.tryFindObjectFile('package.json')?.addDeletionOverride('jest');
    this.tsconfigDev.addInclude('vitest.config.ts');

    // Modify the test task to use Vitest instead of Jest
    this.tasks.tryFind('test')?.reset();
    this.tasks.tryFind('test')?.exec('vitest run -u', { receiveArgs: true });

    // Also update test:watch task
    const testWatchTask = this.tasks.tryFind('test:watch');
    if (testWatchTask) {
      testWatchTask.reset();
      testWatchTask.exec('vitest watch');
      // Update the description to mention Vitest instead of Jest
      testWatchTask.description = 'Run vitest in watch mode';
    }

    // Create a simple vitest.config.ts file
    new SampleFile(this, 'vitest.config.ts', {
      contents: `
// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['${TypescriptApplicationProject.DEFAULT_VITEST_CONFIG_INCLUDE.join('\', \'')}'],
    ${options.vitestPassWithNoTests ? 'passWithNoTests: true,' : ''}
  },
});
`,
    });
    this.addTask('test:compile', {
      exec: 'tsc --noEmit --project tsconfig.dev.json',
    });

    // TODO refactor
    this.tryFindObjectFile('.github/workflows/build.yml')?.patch(
      JsonPatch.add('/jobs/build/permissions/packages', 'read'),
      JsonPatch.replace('/jobs/build/steps/2', WorkflowActionsX.setupNode(options)),
      JsonPatch.add('/jobs/build/steps/3/env', { NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }),
      JsonPatch.add('/jobs/build/steps/5', { name: 'build-tests', run: 'pnpm run test:compile' }),
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
      JsonPatch.add('/jobs/upgrade/steps/5', WorkflowActionsX.pnpmUpdate({ noSave: true })),
      JsonPatch.add('/jobs/pr/permissions/pull-requests', 'write'),
      JsonPatch.add('/jobs/pr/permissions/contents', 'write'),
      JsonPatch.add('/jobs/pr/steps/0/with/token', '${{ secrets.GITHUB_TOKEN }}'),
    );

    this.tryFindObjectFile('package.json')?.addOverride('volta.node', nodeVersion(options));
    this.tryFindObjectFile('package.json')?.addOverride('volta.pnpm', pnpmVersion());
  }
}
