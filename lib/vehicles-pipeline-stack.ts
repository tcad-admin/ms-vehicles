import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Pipeline } from "aws-cdk-lib/aws-codepipeline"
import { aws_codebuild, aws_codepipeline, aws_codepipeline_actions, aws_iam } from "aws-cdk-lib"

export class VehiclesPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const buildOutput = new aws_codepipeline.Artifact(), sourceOutput = new aws_codepipeline.Artifact()
    const oauth = cdk.SecretValue.secretsManager('repos-token', { jsonField: 'github-token' })
    const source = new aws_codepipeline_actions.GitHubSourceAction({
      actionName: 'Github_Source',
      owner: 'tcad-admin',
      repo: 'ms-vehicles',
      branch: 'main',
      oauthToken: oauth,
      output: sourceOutput
    })

    const buildCfnOutput = new aws_codepipeline.Artifact()
    const buildCfnProject = new aws_codebuild.PipelineProject(this, 'BuildDeployLambdaProject', {
      environment: {
        buildImage: aws_codebuild.LinuxBuildImage.STANDARD_7_0
      },
      buildSpec: aws_codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '20',
            },
            commands: ['npm i', 'npm i -g cdk-assets@latest']
          },
          build: {
            commands: ['npm run build', 'npx cdk synth', 'ls -R ./cdk.out', 'cdk-assets --path ./cdk.out/VehiclesLambdaStack.assets.json --verbose publish']
          }
        },
        artifacts: {
          files: '**/*',
          "base-directory": '*'
        }
      })
    })
    const buildDeploy = new aws_codepipeline_actions.CodeBuildAction({
      input: sourceOutput,
      runOrder: 1,
      outputs: [buildCfnOutput],
      actionName: 'Build_Deploy_Lambda',
      project: buildCfnProject
    })
      ; (buildCfnProject.role as aws_iam.Role).attachInlinePolicy(new aws_iam.Policy(this, 'VehiclesLambdaStackPolicy', {
        statements: [
          new aws_iam.PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: [`arn:aws:iam::${this.account}:role/cdk-*-file-publishing-role-${this.account}-${this.region}`]
          })
        ]
      }))

    const deploy = new aws_codepipeline_actions.CloudFormationCreateUpdateStackAction({
      actionName: 'Deploy_Vehicles_Lambda',
      stackName: 'VehiclesLambdaStack',
      templatePath: buildCfnOutput.atPath('VehiclesLambdaStack.template.json'),
      adminPermissions: true,
      runOrder: 2
    })

    // Create the pipeline
    new Pipeline(this, 'VehiclesPipeline', {
      pipelineType: aws_codepipeline.PipelineType.V2,
      pipelineName: 'VehiclesPipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [source]
        },
        {
          stageName: 'Deploy',
          actions: [buildDeploy, deploy]
        }
      ]
    })
  }
} 