import { Testing } from 'projen';
import { describe, it, expect } from 'vitest';
import { BaseProject, DevContainerConfiguration, GoProject, GradleLibraryProject, RustProject, TypescriptApplicationProject, devContainerFeature } from '../../src';

const FILE = '.devcontainer/devcontainer.json';
const LOCKFILE = '.devcontainer/devcontainer-lock.json';
const NODE = devContainerFeature('ghcr.io/devcontainers/features/node');
const DOCKER_IN_DOCKER = devContainerFeature('ghcr.io/devcontainers/features/docker-in-docker');

describe('devContainerFeature', () => {
  it('uses the tag of the registry', () => {
    expect(NODE).toMatch(/^ghcr\.io\/devcontainers\/features\/node:\d+$/);
  });

  it('uses the tag when a version is given', () => {
    expect(devContainerFeature('ghcr.io/devcontainers/features/node', '2')).toBe('ghcr.io/devcontainers/features/node:2');
  });
});

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
      [NODE]: { version: '22.1.0', pnpmVersion: '10.0.0' },
    });
    expect(config.customizations.codespaces.repositories).toEqual({
      'gplassard/test-project': { permissions: { packages: 'read', contents: 'write' } },
    });
  });

  it('supports docker in docker with custom options and extra features', () => {
    const project = baseProject();
    new DevContainerConfiguration(project, {
      repository: 'gplassard/test-project',
      dockerInDocker: { enabled: true, options: { moby: false } },
      features: { 'ghcr.io/devcontainers/features/github-cli:1': {} },
      codespaces: {
        currentRepositoryPermissions: { contents: 'read' },
        repositories: { 'gplassard/other': { permissions: { packages: 'read' } } },
      },
    });
    const config = Testing.synth(project)[FILE];
    expect(config.features[DOCKER_IN_DOCKER]).toEqual({ moby: false });
    expect(config.features['ghcr.io/devcontainers/features/github-cli:1']).toEqual({});
    expect(config.customizations.codespaces.repositories).toEqual({
      'gplassard/test-project': { permissions: { contents: 'read' } },
      'gplassard/other': { permissions: { packages: 'read' } },
    });
  });

  it('uses the given tag when a feature version is given, without locking it', () => {
    const project = baseProject();
    new DevContainerConfiguration(project, { node: { version: '2' }, dockerInDocker: { enabled: true, version: '3' } });
    const synth = Testing.synth(project);
    expect(Object.keys(synth[FILE].features)).toEqual([
      'ghcr.io/devcontainers/features/node:2',
      'ghcr.io/devcontainers/features/docker-in-docker:3',
    ]);
    expect(synth[LOCKFILE]).toBeUndefined();
  });

  it('generates a lockfile following the devcontainer spec', () => {
    const project = baseProject();
    new DevContainerConfiguration(project, {
      dockerInDocker: { enabled: true },
      features: { 'ghcr.io/devcontainers/features/github-cli:1': {} },
    });
    const lockfile = Testing.synth(project)[LOCKFILE];
    expect(Object.keys(lockfile.features)).toEqual([NODE, DOCKER_IN_DOCKER]);
    expect(lockfile.features[NODE]).toEqual({
      version: expect.stringMatching(/^1\.\d+\.\d+$/),
      resolved: expect.stringMatching(/^ghcr\.io\/devcontainers\/features\/node@sha256:[0-9a-f]{64}$/),
      integrity: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
    });
    expect(lockfile.features[NODE].resolved).toBe(`ghcr.io/devcontainers/features/node@${lockfile.features[NODE].integrity}`);
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
    ['go', () => new GoProject({ name: 'test-project' }), devContainerFeature('ghcr.io/devcontainers/features/go')],
    ['rust', () => new RustProject({ name: 'test-project' }), devContainerFeature('ghcr.io/devcontainers/features/rust')],
    ['gradle', () => new GradleLibraryProject({ name: 'test-project' }), devContainerFeature('ghcr.io/devcontainers/features/java')],
  ])('%s project has node, its language feature and codespaces permissions', (_name, create, feature) => {
    const config = Testing.synth(create())[FILE];
    expect(Object.keys(config.features)).toEqual([NODE, feature]);
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
    expect(Object.keys(Testing.synth(withDind)[FILE].features)).toContain(DOCKER_IN_DOCKER);

    const disabled = new RustProject({ name: 'test-project', devContainers: { enabled: false } });
    expect(Testing.synth(disabled)[FILE]).toBeUndefined();
  });
});

describe('TypescriptApplicationProject devcontainer', () => {
  it('has node, pnpm and codespaces permissions by default, without docker in docker', () => {
    const project = new TypescriptApplicationProject({ name: 'test-project' });
    const config = Testing.synth(project)[FILE];
    const featureIds = Object.keys(config.features);
    expect(featureIds).toEqual([NODE]);
    expect(config.features[NODE].version).toBeDefined();
    expect(config.features[NODE].pnpmVersion).toBeDefined();
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
    expect(Object.keys(Testing.synth(withDind)[FILE].features)).toContain(DOCKER_IN_DOCKER);

    const disabled = new TypescriptApplicationProject({
      name: 'test-project',
      devContainers: { enabled: false },
    });
    expect(Testing.synth(disabled)[FILE]).toBeUndefined();
  });
});
