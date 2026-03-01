import goVersionJson from './go.json';
import golangciLintVersionJson from './golangci-lint.json';
import { githubAction } from '../github';

export function goVersion(options?: { goVersion?: string }): string {
  return options?.goVersion ?? goVersionJson.version;
}

export function golangciLintVersion(options?: { golangciLintVersion?: string }): string {
  return options?.golangciLintVersion ?? golangciLintVersionJson.version;
}

export function goBuild() {
  return {
    name: 'Build',
    run: 'go build ./...',
  };
}

export const GO_TEST = {
  name: 'Tests',
  run: 'go test -v ./...',
};

export function goCaches(options?: { goVersion?: string }) {
  return [
    {
      name: 'Set up Go',
      uses: githubAction('actions/setup-go'),
      with: {
        'go-version': goVersion(options),
      },
    },
  ];
}
