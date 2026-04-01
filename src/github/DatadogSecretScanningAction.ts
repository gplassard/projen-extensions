import { Component, JsonPatch, YamlFile } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { githubAction } from './utils';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface DatadogSecretScanningActionProps {
  ddSite?: string;
}

export class DatadogSecretScanningAction extends Component {
  constructor(scope: GitHub, props: DatadogSecretScanningActionProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'Datadog-Secret-Scanning');
    workflow.on({
      push: {},
    });
    workflow.addJob('secret-scanning', {
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
      },
      steps: [
        WorkflowActionsX.checkout({}),
        {
          name: 'Check code meets quality and security standards',
          uses: githubAction('DataDog/datadog-static-analyzer-github-action'),
          with: {
            dd_app_key: '${{ secrets.DD_APP_KEY }}',
            dd_api_key: '${{ secrets.DD_API_KEY }}',
            dd_site: props.ddSite ?? 'datadoghq.eu',
            secrets_enabled: true,
            static_analysis_enabled: false,
            cpu_count: 2,
          },
        },
      ],
    });
    workflow?.file?.patch(
      JsonPatch.add('/permissions', {}),
    );
  }
}
