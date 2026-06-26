# Project Context

## Overview

This is a library of [projen](https://projen.io/) extensions. Projen is a project generation and management tool that uses the CDK for infrastructure as code.

## Domain Terminology

| Term | Definition |
|------|------------|
| **Projen** | A tool for managing project configuration through code (TypeScript) |
| **Construct** | A reusable component in the CDK/projen ecosystem |
| **Project** | A projen-managed codebase with defined build workflows |
| **Extension** | A custom construct that extends projen's default project types |

## Architecture

- **Language**: TypeScript
- **Framework**: projen (constructs)
- **Package Manager**: pnpm
- **Build Tool**: projen (wraps eslint, typescript, vitest, etc.)
- **Publish Target**: GitHub Packages (npm registry at `https://npm.pkg.github.com/`)

## Project Structure

- `src/` — TypeScript source code for extensions
- `lib/` — Compiled JavaScript (output of `projen compile`)
- `test/` — Test files
- `.projenrc.ts` — Project configuration
- `package.json` — Package metadata (managed by projen)

## Key Dependencies

- `projen` - Core project generation framework
- `constructs` - CDK constructs library
- `typescript` - Language support
- `eslint` - Linting
- `vitest` - Testing framework

## Development Workflow

```bash
# Install dependencies
pnpm install

# Compile TypeScript
pnpm compile

# Run tests
pnpm test

# Build the project
pnpm build

# Bump version
pnpm bump
```

## Related Documentation

- [ADRs](./docs/adr/) — Architectural Decision Records
