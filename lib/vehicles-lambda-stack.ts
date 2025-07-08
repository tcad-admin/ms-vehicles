import * as cdk from 'aws-cdk-lib'
import * as lambdajs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path'
import { Construct } from 'constructs'

export class VehiclesLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Vehicles table
    const vehiclesTable = dynamodb.Table.fromTableAttributes(this, 'VehiclesTable', { tableName: 'vehicles' })

    // Create a Lambda function for managing Vehicles
    const vehiclesLambda = new lambdajs.NodejsFunction(this, 'VehiclesLambda', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/src/index.ts'),
      functionName: 'ms-vehicles-lambda',
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: ['aws-sdk'], // Exclude aws-sdk as it's provided by Lambda runtime
      },
      environment: {
        VEHICLES_TABLE: vehiclesTable.tableName,
      },
      timeout: cdk.Duration.seconds(60),
    })

    // Grant the Lambda function permissions to interact with the vehicles table
    vehiclesTable.grantReadWriteData(vehiclesLambda)
  }
} 