import { Testing } from 'projen';
import { GradleLibraryProject, RustProject } from '../../src';

describe('GradleLibraryProject', () => {
  it('synthesizes', () => {
    const project = new GradleLibraryProject({
      name: 'test-project',
      githubLint: {},
      gradleBuildAction: {},
      gradleReleaseAction: {
        gradle: {
          codeArtifactPublishTasks: [
            'publishAllPublicationsToCodeArtifactRepository',
          ],
          githubRegistryPublishTasks: [
            'publishAllPublicationsToGithubPackagesRepository',
          ],
        },
        libraryName: 'my-awesome-library',
        tagPattern: 'v*',
      },
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });

  it('synthesizes with subprojects', () => {
    const project = new GradleLibraryProject({
      name: 'root-project',
    });
    new GradleLibraryProject({
      parent: project,
      name: 'sub-project-one',
      outdir: './sub-project-one',
      gradleReleaseAction: {
        gradle: {
          codeArtifactPublishTasks: [
            ':sub-project-one:publishAllPublicationsToCodeArtifactRepository',
          ],
          githubRegistryPublishTasks: [
            ':sub-project-one:publishAllPublicationsToGithubPackagesRepository',
          ],
        },
        libraryName: 'sub-project-one',
        tagPattern: 'sub-project-one-*',
      },
    });
    new GradleLibraryProject({
      parent: project,
      name: 'sub-project-two',
      outdir: './sub-project-two',
      gradleReleaseAction: {
        gradle: {
          codeArtifactPublishTasks: [
            ':sub-project-two:publishAllPublicationsToCodeArtifactRepository',
          ],
          githubRegistryPublishTasks: [
            ':sub-project-two:publishAllPublicationsToGithubPackagesRepository',
          ],
        },
        libraryName: 'sub-project-two',
        tagPattern: 'sub-project-two-*',
      },
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});
