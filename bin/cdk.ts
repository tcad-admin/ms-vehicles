import * as cdk from 'aws-cdk-lib'
import { VehiclesPipelineStack } from '../lib/vehicles-pipeline-stack'
import { VehiclesLambdaStack } from '../lib/vehicles-lambda-stack'
import { environments, parseStage, stackName, STAGES, Stage } from '../config/stage'

const app = new cdk.App()
const stage = parseStage(app.node.tryGetContext('env'))
const isPipelineDeploy = app.node.tryGetContext('pipeline') === 'true'
const envFor = (s: Stage) => ({
  account: environments[s].account,
  region: environments[s].region,
})

const stagesToSynth: Stage[] = isPipelineDeploy ? STAGES : [stage]

stagesToSynth.forEach((s) => {
  new VehiclesPipelineStack(app, stackName('VehiclesPipelineStack', s), {
    env: envFor(s),
    stage: s,
    stackName: stackName('VehiclesPipelineStack', s),
  })
  new VehiclesLambdaStack(app, stackName('VehiclesLambdaStack', s), {
    env: envFor(s),
    stage: s,
    stackName: stackName('VehiclesLambdaStack', s),
  })
})

app.synth()
