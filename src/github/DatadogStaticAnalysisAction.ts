import { Component, JsonPatch, YamlFile } from 'projen';
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

    // from https://docs.datadoghq.com/security/code_security/static_analysis/setup/?tab=github
    new YamlFile(this, 'static-analysis.datadog.yaml', {
      obj: {
        'schema-version': 'v1',
        'rulesets': [
          'apex-code-style',
          'apex-security',
          'csharp-best-practices',
          'csharp-code-style',
          'csharp-security',
          'csharp-inclusive',
          'docker-best-practices',
          'github-actions',
          'go-best-practices',
          'go-inclusive',
          'go-security',
          'java-best-practices',
          'java-code-style',
          'java-security',
          'javascript-best-practices',
          'javascript-browser-security',
          'javascript-code-style',
          'javascript-inclusive',
          'javascript-common-security',
          'javascript-express',
          'javascript-node-security',
          'jsx-react',
          'kotlin-security',
          'kotlin-inclusive',
          'kotlin-code-style',
          'kotlin-best-practices',
          'php-best-practices',
          'php-security',
          'python-best-practices',
          'python-code-style',
          'python-django',
          'python-flask',
          'python-inclusive',
          'python-pandas',
          'python-security',
          'ruby-code-style',
          'ruby-security',
          'ruby-best-practices',
          'rails-best-practices',
          'swift-code-style',
          'swift-security',
          'swift-inclusive',
          'tsx-react',
          'typescript-best-practices',
          'typescript-browser-security',
          'typescript-code-style',
          'typescript-common-security',
          'typescript-express',
          'typescript-inclusive',
          'typescript-node-security',
        ],
      },
    });
  }
}
