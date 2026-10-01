import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline'
import { aws_codebuild, aws_codepipeline, aws_codepipeline_actions, aws_iam } from 'aws-cdk-lib'
import { Stage, stackName } from '../config/stage'

const GITHUB_CONNECTION_ARN =
  'arn:aws:codestar-connections:us-east-1:850995555404:connection/ced76f38-3f34-4039-a94e-b0c96044b270'

const BRANCH_FOR_STAGE: Record<Stage, string> = {
  dev: 'dev',
  staging: 'staging',
  prod: 'main',
}

export interface VehiclesPipelineStackProps extends cdk.StackProps {
  stage: Stage
}

export class VehiclesPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VehiclesPipelineStackProps) {
    super(scope, id, props)

    const { stage } = props
    const branch = BRANCH_FOR_STAGE[stage]
    const lambdaStackId = stackName('VehiclesLambdaStack', stage)
    const pipelineName = stackName('VehiclesPipeline', stage)
    const sourceOutput = new aws_codepipeline.Artifact()
    const buildOutput = new aws_codepipeline.Artifact()

    const source = new aws_codepipeline_actions.CodeStarConnectionsSourceAction({
      actionName: 'GitHub_Source',
      owner: 'tcad-admin',
      repo: 'ms-vehicles',
      branch,
      connectionArn: GITHUB_CONNECTION_ARN,
      output: sourceOutput,
      triggerOnPush: true,
    })

    const project = new aws_codebuild.PipelineProject(this, 'BuildDeployLambdaProject', {
      environment: { buildImage: aws_codebuild.LinuxBuildImage.STANDARD_7_0 },
      buildSpec: aws_codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: '20' },
            commands: ['npm i', 'npm i -g cdk-assets@latest'],
          },
          build: {
            commands: [
              'npm run build',
              `npx cdk synth --context env=${stage}`,
              `cdk-assets --path ./cdk.out/${lambdaStackId}.assets.json --verbose publish`,
            ],
          },
        },
        artifacts: {
          files: '**/*',
          'base-directory': 'cdk.out',
        },
      }),
    })

    ;(project.role as aws_iam.Role).attachInlinePolicy(
      new aws_iam.Policy(this, 'VehiclesLambdaStackPolicy', {
        statements: [
          new aws_iam.PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: [
              `arn:aws:iam::${this.account}:role/cdk-*-file-publishing-role-${this.account}-${this.region}`,
            ],
          }),
        ],
      })
    )

    new Pipeline(this, 'VehiclesPipeline', {
      pipelineType: aws_codepipeline.PipelineType.V2,
      pipelineName,
      stages: [
        { stageName: 'Source', actions: [source] },
        {
          stageName: 'Deploy',
          actions: [
            new aws_codepipeline_actions.CodeBuildAction({
              actionName: 'Build_Deploy_Lambda',
              project,
              input: sourceOutput,
              outputs: [buildOutput],
              runOrder: 1,
            }),
            new aws_codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'Deploy_Vehicles_Lambda',
              stackName: lambdaStackId,
              templatePath: buildOutput.atPath(`${lambdaStackId}.template.json`),
              adminPermissions: true,
              runOrder: 2,
            }),
          ],
        },
      ],
    })
  }
}
