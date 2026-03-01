import { Component, JsonPatch } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from './WorkflowActionsX';
import { githubAction } from './utils';

export interface DatadogSoftwareCompositionAnalysisActionProps {
  ddSite?: string;
  ddService: string;
}

export class DatadogSoftwareCompositionAnalysisAction extends Component {
  constructor(scope: GitHub, props: DatadogSoftwareCompositionAnalysisActionProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'Datadog-Software-Composition-Analysis');
    workflow.on({
      push: {},
    });
    workflow.addJob('software-composition-analysis', {
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
      },
      steps: [
        WorkflowActionsX.checkout({}),
        {
          name: 'Check imported libraries are secure and compliant',
          uses: githubAction('DataDog/datadog-sca-github-action'),
          with: {
            dd_app_key: '${{ secrets.DD_APP_KEY }}',
            dd_api_key: '${{ secrets.DD_API_KEY }}',
            dd_site: props.ddSite ?? 'datadoghq.eu',
            dd_service: props.ddService,
          },
        },
      ],
    });
    workflow?.file?.patch(
      JsonPatch.add('/permissions', {}),
    );
  }
}
