import { Component, JsonFile, Project } from 'projen';
import { devContainerFeature, devContainerLockfileFeatures } from './features';
import { nodeVersion, pnpmVersion } from '../github/utils';

export const DEFAULT_DEV_CONTAINER_IMAGE = 'mcr.microsoft.com/devcontainers/base:ubuntu';

export type DevContainerFeatureOptions = Record<string, unknown>;

export interface DevContainerManagedFeatureOptions {
  readonly enabled?: boolean;
  /** Version tag of the feature, replaces the default tag of the registry (the feature is then not locked) */
  readonly version?: string;
  /** Raw options of the feature, merged on top of the defaults */
  readonly options?: DevContainerFeatureOptions;
}

export interface DevContainerNodeFeatureOptions extends DevContainerManagedFeatureOptions {
  /** @default the default node version of the library */
  readonly nodeVersion?: string;
  /** @default the default pnpm version of the library */
  readonly pnpmVersion?: string;
}

export interface DevContainerCodespacesRepositoryOptions {
  readonly permissions: Record<string, string>;
}

export interface DevContainerCodespacesOptions {
  readonly repositories?: Record<string, DevContainerCodespacesRepositoryOptions>;
  /** @default { packages: 'read', contents: 'write' } */
  readonly currentRepositoryPermissions?: Record<string, string>;
  /** Merged at the root of `customizations.codespaces` */
  readonly additional?: Record<string, unknown>;
}

export interface DevContainerConfigurationOptions {
  /** @default project name */
  readonly name?: string;
  readonly image?: string;
  /** Current repository (`owner/name`), used for the codespaces permissions */
  readonly repository?: string;
  /** Enabled by default */
  readonly node?: DevContainerNodeFeatureOptions;
  /** Enabled by default */
  readonly sshd?: DevContainerManagedFeatureOptions;
  /** Disabled by default */
  readonly dockerInDocker?: DevContainerManagedFeatureOptions;
  /** Extra features, keyed by full feature id including version */
  readonly features?: Record<string, DevContainerFeatureOptions>;
  /** Set to `false` to skip the codespaces customizations */
  readonly codespaces?: DevContainerCodespacesOptions | false;
  readonly vscodeExtensions?: string[];
  readonly forwardPorts?: number[];
  readonly postCreateCommand?: string;
  /** Extra `customizations` entries */
  readonly customizations?: Record<string, unknown>;
  /** Raw properties merged at the root of `devcontainer.json` */
  readonly additionalConfig?: Record<string, unknown>;
}

export interface DevContainersProps {
  /** @default true */
  readonly enabled?: boolean;
  readonly options?: DevContainerConfigurationOptions;
}

export class DevContainerConfiguration extends Component {
  public static readonly FILE_PATH = '.devcontainer/devcontainer.json';
  /** Lockfile of the features, next to `devcontainer.json` as described by the devcontainer spec */
  public static readonly LOCKFILE_PATH = '.devcontainer/devcontainer-lock.json';

  constructor(project: Project, options: DevContainerConfigurationOptions = {}) {
    super(project);

    const features: Record<string, DevContainerFeatureOptions> = {};

    if (options.node?.enabled ?? true) {
      features[devContainerFeature('ghcr.io/devcontainers/features/node', options.node?.version)] = {
        version: nodeVersion({ nodeVersion: options.node?.nodeVersion }),
        pnpmVersion: options.node?.pnpmVersion ?? pnpmVersion(),
        ...options.node?.options,
      };
    }

    if (options.dockerInDocker?.enabled ?? false) {
      features[devContainerFeature('ghcr.io/devcontainers/features/docker-in-docker', options.dockerInDocker?.version)] = {
        ...options.dockerInDocker?.options,
      };
    }

    if (options.sshd?.enabled ?? true) {
      features[devContainerFeature('ghcr.io/devcontainers/features/sshd', options.sshd?.version)] = {
        version: 'latest',
        ...options.sshd?.options,
      };
    }

    Object.assign(features, options.features);

    const customizations: Record<string, unknown> = {};
    if (options.vscodeExtensions && options.vscodeExtensions.length > 0) {
      customizations.vscode = { extensions: options.vscodeExtensions };
    }
    if (options.codespaces !== false) {
      const repositories: Record<string, DevContainerCodespacesRepositoryOptions> = {
        ...(options.repository
          ? {
            [options.repository]: {
              permissions: options.codespaces?.currentRepositoryPermissions ?? { packages: 'read', contents: 'write' },
            },
          }
          : {}),
        ...options.codespaces?.repositories,
      };
      const codespaces: Record<string, unknown> = {
        ...(Object.keys(repositories).length > 0 ? { repositories } : {}),
        ...options.codespaces?.additional,
      };
      if (Object.keys(codespaces).length > 0) {
        customizations.codespaces = codespaces;
      }
    }
    Object.assign(customizations, options.customizations);

    new JsonFile(this.project, DevContainerConfiguration.FILE_PATH, {
      obj: {
        name: options.name ?? this.project.name,
        image: options.image ?? DEFAULT_DEV_CONTAINER_IMAGE,
        features,
        ...(options.forwardPorts && options.forwardPorts.length > 0 ? { forwardPorts: options.forwardPorts } : {}),
        ...(options.postCreateCommand ? { postCreateCommand: options.postCreateCommand } : {}),
        ...(Object.keys(customizations).length > 0 ? { customizations } : {}),
        ...options.additionalConfig,
      },
      allowComments: true,
    });

    const lockedFeatures = devContainerLockfileFeatures(Object.keys(features));
    if (Object.keys(lockedFeatures).length > 0) {
      new JsonFile(this.project, DevContainerConfiguration.LOCKFILE_PATH, {
        obj: { features: lockedFeatures },
        marker: false,
      });
    }
  }
}

/**
 * Merges project defaults under the user provided `devContainers` props.
 */
export function mergeDevContainers(props: DevContainersProps | undefined, defaults: DevContainerConfigurationOptions): DevContainersProps {
  const options = props?.options;
  return {
    enabled: props?.enabled,
    options: {
      ...defaults,
      ...options,
      node: { ...defaults.node, ...options?.node },
      sshd: { ...defaults.sshd, ...options?.sshd },
      features: { ...defaults.features, ...options?.features },
    },
  };
}

export function defaultRepository(projectName: string): string {
  return `gplassard/${projectName.replace(/^@[^/]+\//, '')}`;
}

/**
 * Returns the options to give to `DevContainerConfiguration`, or `undefined` when the devcontainer is disabled.
 */
export function resolveDevContainerOptions(
  props: DevContainersProps | undefined,
  defaults: DevContainerConfigurationOptions = {},
): DevContainerConfigurationOptions | undefined {
  const merged = mergeDevContainers(props, defaults);
  return (merged.enabled ?? true) ? merged.options : undefined;
}
