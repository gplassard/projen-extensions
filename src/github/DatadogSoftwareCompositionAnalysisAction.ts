import { Component, JsonPatch } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface DatadogSoftwareCompositionAnalysisActionProps {
  ddSite?: string;
  ddService: string;
}

export class DatadogSoftwareCompositionAnalysisAction extends Component {
  constructor(scope: GitHub, props: DatadogSoftwareCompositionAnalysisActionProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'Datadog-Software-Composition-Analysis');
    workflow.on({
      pullRequest: {
        branches: ['main'],
      },
      push: {
        branches: ['main'],
      },
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
          uses: 'DataDog/datadog-sca-github-action@v2',
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
