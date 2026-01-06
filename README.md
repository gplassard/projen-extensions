# Projen extensions

[Projen](https://github.com/projen/projen) modules (work in progress).


# Usage

## Requirements
* nodejs
* [access to github npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

## For a rust project

```shell
pnpm init
echo "@gplassard:registry=https://npm.pkg.github.com" > .npmrc
pnpm install --save-dev projen @gplassard/projen-extensions
```

Create a `.projenrc.js` file (see below)


```javascript
// .projenrc.js
const { RustProject } = require('@gplassard/projen-extensions');

const project = new RustProject({
   name: 'projectName',
});
project.synth();
```


```shell
node .projenrc.js # will generate your project files
```

## For a go project

```shell
pnpm init
echo "@gplassard:registry=https://npm.pkg.github.com" > .npmrc
pnpm install --save-dev projen @gplassard/projen-extensions
```

Create a `.projenrc.js` file (see below)


```javascript
// .projenrc.js
const { GoProject } = require('@gplassard/projen-extensions');

const project = new GoProject({
   name: 'projectName',
});
project.synth();
```


```shell
node .projenrc.js # will generate your project files
```

## For a typescript project

```shell
pnpm init
echo "@gplassard:registry=https://npm.pkg.github.com" > .npmrc
pnpm install --save-dev projen @gplassard/projen-extensions tsx typescript
```

Create a `.projenrc.ts` file (see below)

### For an application
```typescript
// .projenrc.ts
import { TypescriptApplicationProject } from '@gplassard/projen-extensions';

// opinionated wrapper around projen TypeScriptProject
const project = new TypescriptApplicationProject({
    name: 'projectName',
});
project.synth();
```

### For a library
```typescript
// .projenrc.ts
import { TypescriptLibraryProject } from '@gplassard/projen-extensions';

// opinionated wrapper around projen TypeScriptProject for libraries
const project = new TypescriptLibraryProject({
    name: 'projectName', 
    packageName: 'test-project-package-name',
});
project.synth();
```

```shell
pnpm tsx .projenrc.ts # will generate your project files
```

# Resources
* [projen documentation](https://projen.io/)
