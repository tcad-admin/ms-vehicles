import * as cdk from 'aws-cdk-lib'
import { VehiclesPipelineStack } from "../lib/vehicles-pipeline-stack"
import { VehiclesLambdaStack } from "../lib/vehicles-lambda-stack"

const app = new cdk.App()
new VehiclesPipelineStack(app, 'VehiclesPipelineStack', { env: { account: '850995555404', region: 'us-east-1' } })
new VehiclesLambdaStack(app, 'VehiclesLambdaStack', { env: { account: '850995555404', region: 'us-east-1' } })

app.synth() 