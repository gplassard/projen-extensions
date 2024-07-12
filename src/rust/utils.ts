export const CARGO_BUILD = {
  name: 'Build',
  run: 'cargo build --release',
};
export const CARGO_TEST = {
  name: 'Tests',
  run: 'cargo test --verbose',
};
export const CARGO_CACHES = [
  {
    name: 'Cache cargo registry',
    uses: 'actions/cache@v4',
    with: {
      path: '~/.cargo/registry',
      key: "${{ runner.os }}-cargo-registry-${{ hashFiles('**/Cargo.lock') }}",
    },
  },
  {
    name: 'Cache cargo index',
    uses: 'actions/cache@v4',
    with: {
      path: '~/.cargo/git',
      key: "${{ runner.os }}-cargo-git-${{ hashFiles('**/Cargo.lock') }}",
    },
  },
  {
    name: 'Cache cargo build',
    uses: 'actions/cache@v4',
    with: {
      path: 'target',
      key: "${{ runner.os }}-cargo-build-target-${{ hashFiles('**/Cargo.lock') }}",
    },
  },
];
