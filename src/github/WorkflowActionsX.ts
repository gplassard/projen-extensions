import { JobStep } from 'projen/lib/github/workflows-model';
import { nodeVersion, pnpmVersion } from './utils';

export class WorkflowActionsX {

  static checkout(withOptions: Record<string, unknown>): JobStep {
    return {
      name: 'Checkout',
      uses: 'actions/checkout@v4',
      with: {
        'fetch-depth': 0,
        ...withOptions,
      },
    };
  }

  static setupNode(options: { nodeVersion?: string; packageManager?: string }): JobStep {
    return {
      uses: 'actions/setup-node@v4',
      with: {
        'node-version': nodeVersion(options),
        'registry-url': 'https://npm.pkg.github.com',
        'cache': options.packageManager ?? 'pnpm',
      },
    };
  }

  static setupPnpm(_options: {}): JobStep {
    return {
      name: 'Setup pnpm',
      uses: 'pnpm/action-setup@v4',
      with: {
        version: pnpmVersion(),
      },
    };
  }

  static installDependencies(options: {noFrozenLockfile?: boolean}): JobStep {
    return {
      name: 'Install dependencies',
      run: `pnpm i --${options.noFrozenLockfile ? 'no-' : ''}frozen-lockfile`,
      env: {
        NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    };
  }

  static pnpmUpdate(options: {noSave?: boolean}): JobStep {
    return {
      name: 'Update dependencies',
      run: `pnpm update ${options.noSave ? '--no-save' : ''}`,
      env: {
        NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    };
  }
}
