# Projen extensions

[Projen](https://github.com/projen/projen) modules (work in progress).


# Usage

## Requirements
* nodejs
* [access to github npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

## In an existing project

```shell
yarn init
echo "@gplassard:registry=https://npm.pkg.github.com" > .npmrc
yarn add -D projen @gplassard/projen-extensions
```

Create a `.projenrc.js` file (see below)

```shell
yarn projen # will generate your project files
```

### Rust project

```javascript
// .projenrc.js
const { RustProject } = require('@gplassard/projen-extensions');

const project = new RustProject({
   name: 'projectName',
   cargo: {
      package: {
         authors: ["user <user@mail.com>"],
         version: 'version',
         edition: "2021",
      },
      dependencies: {
          // your dependencies
          'fs2': '0.4.3',
      }
   }
});
project.synth();
```

# Resources
* [projen documentation](https://projen.io/)
