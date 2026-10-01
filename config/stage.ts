export type Stage = 'dev' | 'staging' | 'prod'

export const STAGES: Stage[] = ['dev', 'staging', 'prod']

export const stageSuffix = (stage: Stage) => (stage === 'prod' ? '' : `-${stage}`)

export const named = (base: string, stage: Stage) => `${base}${stageSuffix(stage)}`

export const stackName = (base: string, stage: Stage) =>
  stage === 'prod' ? base : `${base}-${stage}`

export function parseStage(value: unknown): Stage {
  const stage = (typeof value === 'string' ? value : 'prod') as Stage
  if (!STAGES.includes(stage)) {
    throw new Error(`Invalid stage '${value}'. Expected one of: ${STAGES.join(', ')}`)
  }
  return stage
}

export const environments: Record<
  Stage,
  { account: string; region: string }
> = {
  dev: { account: '850995555404', region: 'us-east-1' },
  staging: { account: '850995555404', region: 'us-east-1' },
  prod: { account: '850995555404', region: 'us-east-1' },
}
