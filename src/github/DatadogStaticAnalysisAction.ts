import { Component, JsonPatch } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface DatadogStaticAnalysisActionProps {
  ddSite?: string;
}

export class DatadogStaticAnalysisAction extends Component {
  constructor(scope: GitHub, props: DatadogStaticAnalysisActionProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'Datadog-Static-Analysis');
    workflow.on({
      push: {},
    });
    workflow.addJob('static-analysis', {
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
      },
      steps: [
        WorkflowActionsX.checkout({}),
        {
          name: 'Check code meets quality and security standards',
          uses: 'DataDog/datadog-static-analyzer-github-action@v2',
          with: {
            dd_app_key: '${{ secrets.DD_APP_KEY }}',
            dd_api_key: '${{ secrets.DD_API_KEY }}',
            dd_site: props.ddSite ?? 'datadoghq.eu',
            cpu_count: 2,
            enable_performance_statistics: true,
          },
        },
      ],
    });
    workflow?.file?.patch(
      JsonPatch.add('/permissions', {}),
    );
  }
}
