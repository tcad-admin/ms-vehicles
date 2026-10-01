import * as cdk from 'aws-cdk-lib'
import * as lambdajs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as path from 'path'
import { Construct } from 'constructs'
import { named, Stage } from '../config/stage'

export interface VehiclesLambdaStackProps extends cdk.StackProps {
  stage: Stage
}

export class VehiclesLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VehiclesLambdaStackProps) {
    super(scope, id, props)

    const { stage } = props

    const vehiclesTable = dynamodb.Table.fromTableAttributes(this, 'VehiclesTable', {
      tableName: named('vehicles', stage),
    })

    const vehiclesLambda = new lambdajs.NodejsFunction(this, 'VehiclesLambda', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/src/index.ts'),
      functionName: named('ms-vehicles-lambda', stage),
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        forceDockerBundling: false,
        externalModules: ['aws-sdk'],
      },
      environment: {
        VEHICLES_TABLE: vehiclesTable.tableName,
        STAGE: stage,
      },
      timeout: cdk.Duration.seconds(60),
    })

    vehiclesTable.grantReadWriteData(vehiclesLambda)
  }
}
