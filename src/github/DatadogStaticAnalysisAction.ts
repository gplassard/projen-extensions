import { Component } from 'projen';
import { GitHub, GithubCredentials, GithubWorkflow, WorkflowActions, WorkflowJobs } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { NodeJSDependenciesUpgradeActionProps } from './NodeJSDependenciesUpgradeAction';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface DatadogStaticAnalysisActionProps {
  ddSite?: string;
}

export class DatadogStaticAnalysisAction extends Component {
  constructor(scope: GitHub, props: DatadogStaticAnalysisActionProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'Datadog Static Analysis');
    workflow.on({
      pullRequest: {
        branches: ['main'],
      },
      push: {
        branches: ['main'],
      },
    });
    workflow.addJob('static-analysis', {
      runsOn: ['ubuntu-latest'],
      permissions: {},
      steps: [
        WorkflowActionsX.checkout({}),
        {
          name: 'Check code meets quality and security standards',
          uses: 'DataDog/datadog-static-analyzer-github-action@v1',
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
  }
}
