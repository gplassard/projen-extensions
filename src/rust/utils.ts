export function cargoBuild(config?: {release?: boolean; target?: string}) {
  const releaseFlag = config?.release ? '--release' : '';
  const targetFlag = config?.target ? `--target ${config.target}` : '';
  return {
    name: 'Build',
    run: ['cargo build', releaseFlag, targetFlag].join(' '),
  };
};

export const CARGO_TEST = {
  name: 'Tests',
  run: 'cargo test --verbose',
};

export function cargoCaches(config?: {cachePrefix?: string}) {
  const cachePrefix = config?.cachePrefix ?? '';
  return [
    {
      name: 'Cache cargo registry',
      uses: 'actions/cache@v4',
      with: {
        path: '~/.cargo/registry',
        key: cachePrefix + "cargo-registry-${{ hashFiles('**/Cargo.lock') }}",
      },
    },
    {
      name: 'Cache cargo index',
      uses: 'actions/cache@v4',
      with: {
        path: '~/.cargo/git',
        key: cachePrefix + "cargo-git-${{ hashFiles('**/Cargo.lock') }}",
      },
    },
    {
      name: 'Cache cargo build',
      uses: 'actions/cache@v4',
      with: {
        path: 'target',
        key: cachePrefix + "cargo-build-target-${{ hashFiles('**/Cargo.lock') }}",
      },
    },
  ];
}
