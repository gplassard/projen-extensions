import featuresRegistry from './devcontainer-features.json';

/**
 * Entry of `devcontainer-lock.json`, see
 * https://github.com/devcontainers/spec/blob/main/docs/specs/devcontainer-lockfile.md
 */
export interface DevContainerLockfileFeature {
  readonly version: string;
  readonly resolved: string;
  readonly integrity: string;
  readonly dependsOn?: string[];
}

type RegistryKey = keyof typeof featuresRegistry;
type FeatureNameOf<K extends string> = K extends `${infer Name}:${string}` ? Name : never;

export type DevContainerFeatureName = FeatureNameOf<RegistryKey>;

const registry: Record<string, DevContainerLockfileFeature> = featuresRegistry;

/**
 * Returns the feature id to use in `devcontainer.json`: the feature name with its tag (the major version of the
 * registry unless an explicit version is requested).
 */
export function devContainerFeature(name: DevContainerFeatureName, version?: string): string {
  if (version !== undefined) {
    return `${name}:${version}`;
  }
  const key = Object.keys(registry).find(k => k.startsWith(`${name}:`));
  if (!key) {
    throw new Error(`Unknown devcontainer feature ${name}`);
  }
  return key;
}

/**
 * Returns the `devcontainer-lock.json` entries for the given feature ids of a `devcontainer.json`.
 * Keys are lowercased as required by the spec, features missing from the registry are not locked.
 */
export function devContainerLockfileFeatures(featureIds: string[]): Record<string, DevContainerLockfileFeature> {
  const features: Record<string, DevContainerLockfileFeature> = {};
  for (const featureId of featureIds) {
    const key = featureId.toLowerCase();
    if (registry[key]) {
      features[key] = registry[key];
    }
  }
  return features;
}
