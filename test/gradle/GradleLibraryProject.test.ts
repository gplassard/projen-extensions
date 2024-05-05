import { Testing } from 'projen';
import { GradleLibraryProject, RustProject } from '../../src';
import { GradleSubProject } from '../../src/gradle/GradleSubProject';

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
