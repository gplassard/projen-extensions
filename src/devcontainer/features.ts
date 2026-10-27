import featuresRegistry from './devcontainer-features.json';

interface DevContainerFeatureRegistryEntry {
  readonly version: string;
  readonly hash?: string;
  readonly pinned?: boolean;
}

export type DevContainerFeatureName = keyof typeof featuresRegistry;

const registry: Record<DevContainerFeatureName, DevContainerFeatureRegistryEntry> = featuresRegistry;

/**
 * Returns the feature id to use in `devcontainer.json`.
 * The digest from the registry is used unless an explicit version is requested.
 */
export function devContainerFeature(name: DevContainerFeatureName, version?: string): string {
  const feature = registry[name];
  if (version === undefined && feature.hash) {
    return `${name}@${feature.hash}`;
  }
  return `${name}:${version ?? feature.version}`;
}
