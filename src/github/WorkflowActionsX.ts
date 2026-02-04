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

  static installDependencies(options: { noFrozenLockfile?: boolean }): JobStep {
    return {
      name: 'Install dependencies',
      run: `pnpm i --${options.noFrozenLockfile ? 'no-' : ''}frozen-lockfile`,
      env: {
        NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    };
  }

  static pnpmUpdate(options: { noSave?: boolean }): JobStep {
    return {
      name: 'Update dependencies',
      run: `pnpm update ${options.noSave ? '--no-save' : ''}`,
      env: {
        NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    };
  }

  static generateGithubToken(options: { permissions: { [k in string]: string } }): JobStep {
    return {
      name: 'Generate token',
      id: 'generate_token',
      uses: 'actions/create-github-app-token@v2',
      with: {
        'app-id': '${{ secrets.PROJEN_APP_ID }}',
        'private-key': '${{ secrets.PROJEN_APP_PRIVATE_KEY }}',
        ...options.permissions,
      },
    };
  }

  static setupJdk(options: { javaVersion?: string }): JobStep {
    return {
      name: 'Set up JDK',
      uses: 'actions/setup-java@v5',
      with: {
        'java-version': options.javaVersion ?? '21',
        'distribution': 'temurin',
        'cache': 'gradle',
      },
    };
  }

  static configureAwsCredentials(roleName: string): JobStep {
    return {
      name: 'Configure AWS credentials',
      uses: 'aws-actions/configure-aws-credentials@v5',
      with: {
        'role-to-assume': `arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/\${{ secrets.${roleName} }}`,
        'aws-region': 'us-east-1',
      },
    };
  }

  static generateCodeArtifactToken(): JobStep {
    return {
      name: 'Generate code artifact token',
      id: 'code-artifact-token',
      run: [
        'the_secret=$(aws codeartifact get-authorization-token --domain \${{ secrets.CODE_ARTIFACT_DOMAIN }} --domain-owner \${{ secrets.AWS_ACCOUNT_ID }} --region eu-west-1 --query authorizationToken --output text --duration-seconds 900)',
        'echo "::add-mask::$the_secret"',
        'echo "token=$the_secret" >> "$GITHUB_OUTPUT"',
      ].join('\n'),
    };
  }
}
