import { Component, JsonFile, Project } from 'projen';
import { nodeVersion, pnpmVersion } from '../github/utils';

export const DEFAULT_DEV_CONTAINER_IMAGE = 'mcr.microsoft.com/devcontainers/base:ubuntu';
export const NODE_FEATURE_ID = 'ghcr.io/devcontainers/features/node';
export const DOCKER_IN_DOCKER_FEATURE_ID = 'ghcr.io/devcontainers/features/docker-in-docker';
export const DEFAULT_NODE_FEATURE_VERSION = '1';
export const DEFAULT_DOCKER_IN_DOCKER_FEATURE_VERSION = '2';

export type DevContainerFeatureOptions = Record<string, unknown>;

export interface DevContainerManagedFeatureOptions {
  readonly enabled?: boolean;
  /** Major version tag of the feature (the part after the colon in the feature id) */
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

  constructor(project: Project, options: DevContainerConfigurationOptions = {}) {
    super(project);

    const features: Record<string, DevContainerFeatureOptions> = {};

    if (options.node?.enabled ?? true) {
      features[`${NODE_FEATURE_ID}:${options.node?.version ?? DEFAULT_NODE_FEATURE_VERSION}`] = {
        version: nodeVersion({ nodeVersion: options.node?.nodeVersion }),
        pnpmVersion: options.node?.pnpmVersion ?? pnpmVersion(),
        ...options.node?.options,
      };
    }

    if (options.dockerInDocker?.enabled ?? false) {
      features[`${DOCKER_IN_DOCKER_FEATURE_ID}:${options.dockerInDocker?.version ?? DEFAULT_DOCKER_IN_DOCKER_FEATURE_VERSION}`] = {
        ...options.dockerInDocker?.options,
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
