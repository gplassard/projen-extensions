import { Testing } from 'projen';
import { describe, it, expect } from 'vitest';
import { BaseProject, DevContainerConfiguration, GoProject, GradleLibraryProject, RustProject, TypescriptApplicationProject } from '../../src';

const FILE = '.devcontainer/devcontainer.json';

describe('DevContainerConfiguration', () => {
  const baseProject = () => new BaseProject({ name: 'test-project', devContainers: { enabled: false } });
  it('generates node feature and codespaces permissions by default', () => {
    const project = baseProject();
    new DevContainerConfiguration(project, {
      repository: 'gplassard/test-project',
      node: { nodeVersion: '22.1.0', pnpmVersion: '10.0.0' },
    });
    const config = Testing.synth(project)[FILE];
    expect(config.features).toEqual({
      'ghcr.io/devcontainers/features/node:1': { version: '22.1.0', pnpmVersion: '10.0.0' },
    });
    expect(config.customizations.codespaces.repositories).toEqual({
      'gplassard/test-project': { permissions: { packages: 'read', contents: 'write' } },
    });
  });

  it('supports docker in docker with custom options and extra features', () => {
    const project = baseProject();
    new DevContainerConfiguration(project, {
      repository: 'gplassard/test-project',
      dockerInDocker: { enabled: true, version: '2', options: { moby: false } },
      features: { 'ghcr.io/devcontainers/features/github-cli:1': {} },
      codespaces: {
        currentRepositoryPermissions: { contents: 'read' },
        repositories: { 'gplassard/other': { permissions: { packages: 'read' } } },
      },
    });
    const config = Testing.synth(project)[FILE];
    expect(config.features['ghcr.io/devcontainers/features/docker-in-docker:2']).toEqual({ moby: false });
    expect(config.features['ghcr.io/devcontainers/features/github-cli:1']).toEqual({});
    expect(config.customizations.codespaces.repositories).toEqual({
      'gplassard/test-project': { permissions: { contents: 'read' } },
      'gplassard/other': { permissions: { packages: 'read' } },
    });
  });

  it('can disable node feature and codespaces customizations', () => {
    const project = baseProject();
    new DevContainerConfiguration(project, {
      repository: 'gplassard/test-project',
      node: { enabled: false },
      codespaces: false,
    });
    const config = Testing.synth(project)[FILE];
    expect(config.features).toEqual({});
    expect(config.customizations).toBeUndefined();
  });
});

describe('devcontainer in other projects', () => {
  it.each([
    ['go', () => new GoProject({ name: 'test-project' }), 'ghcr.io/devcontainers/features/go:1'],
    ['rust', () => new RustProject({ name: 'test-project' }), 'ghcr.io/devcontainers/features/rust:1'],
    ['gradle', () => new GradleLibraryProject({ name: 'test-project' }), 'ghcr.io/devcontainers/features/java:1'],
  ])('%s project has node, its language feature and codespaces permissions', (_name, create, feature) => {
    const config = Testing.synth(create())[FILE];
    expect(Object.keys(config.features)).toEqual(['ghcr.io/devcontainers/features/node:1', feature]);
    expect(config.customizations.codespaces.repositories['gplassard/test-project'].permissions).toEqual({
      packages: 'read',
      contents: 'write',
    });
  });

  it('can enable docker in docker and disable the devcontainer', () => {
    const withDind = new GoProject({
      name: 'test-project',
      devContainers: { options: { dockerInDocker: { enabled: true } } },
    });
    expect(Object.keys(Testing.synth(withDind)[FILE].features)).toContain('ghcr.io/devcontainers/features/docker-in-docker:2');

    const disabled = new RustProject({ name: 'test-project', devContainers: { enabled: false } });
    expect(Testing.synth(disabled)[FILE]).toBeUndefined();
  });
});

describe('TypescriptApplicationProject devcontainer', () => {
  it('has node, pnpm and codespaces permissions by default, without docker in docker', () => {
    const project = new TypescriptApplicationProject({ name: 'test-project' });
    const config = Testing.synth(project)[FILE];
    const featureIds = Object.keys(config.features);
    expect(featureIds).toEqual(['ghcr.io/devcontainers/features/node:1']);
    expect(config.features['ghcr.io/devcontainers/features/node:1'].version).toBeDefined();
    expect(config.features['ghcr.io/devcontainers/features/node:1'].pnpmVersion).toBeDefined();
    expect(config.customizations.codespaces.repositories['gplassard/test-project'].permissions).toEqual({
      packages: 'read',
      contents: 'write',
    });
  });

  it('can enable docker in docker and be disabled', () => {
    const withDind = new TypescriptApplicationProject({
      name: 'test-project',
      devContainers: { options: { dockerInDocker: { enabled: true } } },
    });
    expect(Object.keys(Testing.synth(withDind)[FILE].features)).toContain('ghcr.io/devcontainers/features/docker-in-docker:2');

    const disabled = new TypescriptApplicationProject({
      name: 'test-project',
      devContainers: { enabled: false },
    });
    expect(Testing.synth(disabled)[FILE]).toBeUndefined();
  });
});
