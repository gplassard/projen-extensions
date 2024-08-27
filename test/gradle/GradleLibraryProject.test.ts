import { Testing } from 'projen';
import { GradleLibraryProject, GradleSubProject } from '../../src';

describe('GradleLibraryProject', () => {
  it('synthesizes', () => {
    const project = new GradleLibraryProject({
      name: 'test-project',
      gradleReleaseActionOptions: {
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
      gradleBuildActionOptions: {
        withCodeArtifactAccess: true,
      },
    });
    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });

  it('synthesizes with subprojects', () => {
    const project = new GradleLibraryProject({
      name: 'root-project',
    });
    const projects = [
      'sub-project-one',
      'sub-project-two',
    ];
    for (const subProject of projects) {
      new GradleSubProject(project, subProject, {
        gradleReleaseActionOptions: {
          gradle: {
            codeArtifactPublishTasks: [
              `:${subProject}:publishAllPublicationsToCodeArtifactRepository`,
            ],
            githubRegistryPublishTasks: [
              `:${subProject}:publishAllPublicationsToGithubPackagesRepository`,
            ],
          },
          libraryName: subProject,
          tagPattern: `${subProject}-*`,
        },
      });
    }

    const output = Testing.synth(project);
    expect(output).toMatchSnapshot();
  });
});
