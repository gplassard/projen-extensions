import { JobStep } from 'projen/lib/github/workflows-model';
import { githubAction, nodeVersion, pnpmVersion } from './utils';

export class WorkflowActionsX {

  static checkout(withOptions: Record<string, unknown>): JobStep {
    return {
      name: 'Checkout',
      uses: githubAction('actions/checkout'),
      with: {
        'fetch-depth': 0,
        ...withOptions,
      },
    };
  }

  static setupNode(options: { nodeVersion?: string; packageManager?: string }): JobStep {
    return {
      uses: githubAction('actions/setup-node'),
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
      uses: githubAction('pnpm/action-setup'),
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

  static setupJdk(options: { javaVersion?: string }): JobStep {
    return {
      name: 'Set up JDK',
      uses: githubAction('actions/setup-java'),
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
      uses: githubAction('aws-actions/configure-aws-credentials'),
      with: {
        'role-to-assume': `arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/\${{ secrets.${roleName} }}`,
        'aws-region': 'us-east-1',
      },
    };
  }

  static uploadGitPatch(options: { stepId: string; outputName: string }): JobStep[] {
    return [
      {
        name: 'Find mutations',
        id: options.stepId,
        run: [
          'git add .',
          `git diff --staged --patch --exit-code > repo.patch || echo "${options.outputName}=true" >> $GITHUB_OUTPUT`,
        ].join('\n'),
        shell: 'bash',
        workingDirectory: './',
      },
      {
        name: 'Upload patch',
        if: `steps.${options.stepId}.outputs.${options.outputName}`,
        uses: githubAction('actions/upload-artifact'),
        with: {
          name: 'repo.patch',
          path: 'repo.patch',
          overwrite: true,
        },
      },
    ];
  }

  static checkoutWithPatch(options: { token: string; ref: string; repository: string }): JobStep[] {
    return [
      {
        name: 'Checkout',
        uses: githubAction('actions/checkout'),
        with: {
          token: options.token,
          ref: options.ref,
          repository: options.repository,
        },
      },
      {
        name: 'Download patch',
        uses: githubAction('actions/download-artifact'),
        with: {
          name: 'repo.patch',
          path: '${{ runner.temp }}',
        },
      },
      {
        name: 'Apply patch',
        run: '[ -s ${{ runner.temp }}/repo.patch ] && git apply ${{ runner.temp }}/repo.patch || echo "Empty patch. Skipping."',
      },
    ];
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
