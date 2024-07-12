export const SETUP_JDK_STEP = {
  name: 'Set up JDK',
  uses: 'actions/setup-java@v4',
  with: {
    'java-version': '21',
    'distribution': 'temurin',
    'cache': 'gradle',
  },
};

export function configureAWSCredentialsStep(roleName: string) {
  return {
    name: 'Configure AWS credentials',
    uses: 'aws-actions/configure-aws-credentials@v4',
    with: {
      'role-to-assume': `arn:aws:iam::$\{{ secrets.AWS_ACCOUNT_ID }}:role/$\{{ secrets.${roleName} }}`,
      'aws-region': 'us-east-1',
    },
  };
}

export const GENERATE_CODE_ARTIFACT_TOKEN_STEP = {
  name: 'Generate code artifact token',
  id: 'code-artifact-token',
  run: [
    'the_secret=$(aws codeartifact get-authorization-token --domain \${{ secrets.CODE_ARTIFACT_DOMAIN }} --domain-owner \${{ secrets.AWS_ACCOUNT_ID }} --region eu-west-1 --query authorizationToken --output text --duration-seconds 900)',
    'echo "::add-mask::$the_secret"',
    'echo "token=$the_secret" >> "$GITHUB_OUTPUT"',
  ].join('\n')
  ,
};
