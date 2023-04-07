export const checkoutTask = {
  uses: 'actions/checkout@v3',
  with: {
    'fetch-depth': 0,
  },
};
export const buildTask = {
  name: 'Build',
  run: 'cargo build --release',
};
export const testsTask = {
  name: 'Tests',
  run: 'cargo test --verbose',
};
