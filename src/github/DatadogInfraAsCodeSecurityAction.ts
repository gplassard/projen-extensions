import { Component, JsonPatch } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { githubAction } from './utils';
import { WorkflowActionsX } from './WorkflowActionsX';

export interface DatadogInfraAsCodeSecurityActionProps {
  ddSite?: string;
}

export class DatadogInfraAsCodeSecurityAction extends Component {
  constructor(scope: GitHub, props: DatadogInfraAsCodeSecurityActionProps) {
    super(scope);

    const workflow = new GithubWorkflow(scope, 'Datadog-Infra-As-Code-Security');
    workflow.on({
      push: {},
    });
    workflow.addJob('infra-as-code-code-security', {
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.READ,
      },
      steps: [
        WorkflowActionsX.checkout({}),
        {
          name: 'Check imported libraries are secure and compliant',
          uses: githubAction('DataDog/datadog-iac-scanner-github-action'),
          with: {
            dd_app_key: '${{ secrets.DD_APP_KEY }}',
            dd_api_key: '${{ secrets.DD_API_KEY }}',
            dd_site: props.ddSite ?? 'datadoghq.eu',
          },
        },
      ],
    });
    workflow?.file?.patch(
      JsonPatch.add('/permissions', {}),
    );
  }
}
