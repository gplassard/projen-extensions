import goVersionJson from './go.json';
import golangciLintVersionJson from './golangci-lint.json';

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
      uses: 'actions/setup-go@v6',
      with: {
        'go-version': goVersion(options),
      },
    },
  ];
}
