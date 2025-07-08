import { AppSyncResolverEvent } from "aws-lambda"
import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  DeleteItemCommandOutput,
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  GetItemCommandOutput,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb"
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

interface CreateVehicleInput {
  make: string
  model: string
  color: string
  ownerId: string
  year?: number
  licensePlate?: string
  vin?: string
  mileage?: number
  fuelType?: string
  transmission?: string
  status?: string
  notes?: string
}

interface UpdateVehicleInput {
  id: string
  make?: string
  model?: string
  color?: string
  year?: number
  licensePlate?: string
  vin?: string
  mileage?: number
  fuelType?: string
  transmission?: string
  status?: string
  ownerId?: string
  notes?: string
}

const dynamoDBClient = new DynamoDBClient()
const VEHICLES_TABLE = process.env.VEHICLES_TABLE!

export const handler = async (event: AppSyncResolverEvent<any>) => {
  try {
    const { info, arguments: args } = event
    const fieldName = info.fieldName

    switch (fieldName) {
      case 'createVehicle':
        return await createVehicle(args.input as CreateVehicleInput)
      case 'updateVehicle':
        return await updateVehicle(args.input as UpdateVehicleInput)
      case 'deleteVehicle':
        return await deleteVehicle(args.id)
      case 'getVehicle':
        return await getVehicle(args.id)
      case 'listAllVehicles':
        return await listAllVehicles()
      case 'listVehiclesByStatus':
        return await listVehiclesByStatus(args.status)
      case 'listVehiclesByOwner':
        return await listVehiclesByOwner(args.ownerId)
      case 'searchVehicles':
        return await searchVehicles(args.searchTerm)
      default:
        throw new Error(`Unknown fieldName: ${fieldName}`)
    }
  } catch (err: any) {
    console.error('Error in handler:', err)
    return {
      error: err?.message || "Internal Server Error",
      success: false
    }
  }
}

const createVehicle = async (input: CreateVehicleInput) => {
  const { make, model, color, year, licensePlate, vin, mileage, fuelType, transmission, status, ownerId, notes } = input

  if (!make || !model || !color || !ownerId) {
    throw new Error('Missing required parameters: make, model, color, and ownerId are required')
  }

  const vehicleId = uuidv4()
  const createdAt = new Date().toISOString()
  const updatedAt = createdAt

  const item: Record<string, any> = {
    id: { S: vehicleId },
    make: { S: make },
    model: { S: model },
    color: { S: color },
    ownerId: { S: ownerId },
    createdAt: { S: createdAt },
    updatedAt: { S: updatedAt }
  }

  // Add optional fields if they exist
  if (year) item.year = { N: year.toString() }
  if (licensePlate) item.licensePlate = { S: licensePlate }
  if (vin) item.vin = { S: vin }
  if (mileage) item.mileage = { N: mileage.toString() }
  if (fuelType) item.fuelType = { S: fuelType }
  if (transmission) item.transmission = { S: transmission }
  if (status) item.status = { S: status }
  if (notes) item.notes = { S: notes }

  const command = new PutItemCommand({
    TableName: VEHICLES_TABLE,
    Item: item
  } as PutItemCommandInput)

  await dynamoDBClient.send(command)

  return {
    id: vehicleId,
    make,
    model,
    color,
    year,
    licensePlate,
    vin,
    mileage,
    fuelType,
    transmission,
    status,
    ownerId,
    notes,
    createdAt,
    updatedAt
  }
}

const updateVehicle = async (input: UpdateVehicleInput) => {
  const { id, ...updateFields } = input

  if (!id) {
    throw new Error('Vehicle ID is required')
  }

  // First, get the existing vehicle to ensure it exists
  const getCommand = new GetItemCommand({
    TableName: VEHICLES_TABLE,
    Key: {
      id: { S: id }
    }
  } as GetItemCommandInput)

  const existingVehicle = await dynamoDBClient.send(getCommand) as GetItemCommandOutput

  if (!existingVehicle.Item) {
    throw new Error('Vehicle not found')
  }

  // Build update expression and attribute values
  const updateExpressionParts: string[] = []
  const expressionAttributeValues: Record<string, any> = {}
  const expressionAttributeNames: Record<string, string> = {}

  Object.entries(updateFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const attributeName = `#${key}`
      const attributeValue = `:${key}`

      expressionAttributeNames[attributeName] = key
      updateExpressionParts.push(`${attributeName} = ${attributeValue}`)

      if (typeof value === 'number') {
        expressionAttributeValues[attributeValue] = { N: value.toString() }
      } else {
        expressionAttributeValues[attributeValue] = { S: value.toString() }
      }
    }
  })

  // Add updatedAt timestamp
  const updatedAt = new Date().toISOString()
  expressionAttributeNames['#updatedAt'] = 'updatedAt'
  expressionAttributeValues[':updatedAt'] = { S: updatedAt }
  updateExpressionParts.push('#updatedAt = :updatedAt')

  if (updateExpressionParts.length === 0) {
    throw new Error('No fields to update')
  }

  const updateExpression = `SET ${updateExpressionParts.join(', ')}`

  const command = new UpdateItemCommand({
    TableName: VEHICLES_TABLE,
    Key: {
      id: { S: id }
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  })

  await dynamoDBClient.send(command)

  // Return the updated vehicle
  return await getVehicle(id)
}

const deleteVehicle = async (id: string) => {
  if (!id) {
    throw new Error('Vehicle ID is required')
  }

  const command = new DeleteItemCommand({
    TableName: VEHICLES_TABLE,
    Key: {
      id: { S: id }
    }
  }) as DeleteItemCommand

  const result = await dynamoDBClient.send(command) as DeleteItemCommandOutput

  return {
    success: result.$metadata.httpStatusCode === 200,
    id: id
  }
}

const getVehicle = async (id: string) => {
  if (!id) {
    throw new Error('Vehicle ID is required')
  }

  const command = new GetItemCommand({
    TableName: VEHICLES_TABLE,
    Key: {
      id: { S: id }
    }
  } as GetItemCommandInput)

  const result = await dynamoDBClient.send(command) as GetItemCommandOutput

  if (!result.Item) {
    throw new Error('Vehicle not found')
  }

  return mapFromDynamodbAttributes(result.Item)
}

const listAllVehicles = async () => {
  const scanCommand = new ScanCommand({
    TableName: VEHICLES_TABLE
  })

  try {
    const result = await dynamoDBClient.send(scanCommand)
    return result.Items?.map(item => mapFromDynamodbAttributes(item)) || []
  } catch (error) {
    console.error("Error listing vehicles:", error)
    throw new Error("Could not retrieve vehicles")
  }
}

const listVehiclesByStatus = async (status: string) => {
  if (!status) {
    throw new Error('Status is required')
  }

  const scanCommand = new ScanCommand({
    TableName: VEHICLES_TABLE,
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': { S: status }
    }
  })

  try {
    const result = await dynamoDBClient.send(scanCommand)
    return result.Items?.map(item => mapFromDynamodbAttributes(item)) || []
  } catch (error) {
    console.error("Error listing vehicles by status:", error)
    throw new Error("Could not retrieve vehicles")
  }
}

const listVehiclesByOwner = async (ownerId: string) => {
  if (!ownerId) {
    throw new Error('Owner ID is required')
  }

  const scanCommand = new ScanCommand({
    TableName: VEHICLES_TABLE,
    FilterExpression: '#ownerId = :ownerId',
    ExpressionAttributeNames: {
      '#ownerId': 'ownerId'
    },
    ExpressionAttributeValues: {
      ':ownerId': { S: ownerId }
    }
  })

  try {
    const result = await dynamoDBClient.send(scanCommand)
    return result.Items?.map(item => mapFromDynamodbAttributes(item)) || []
  } catch (error) {
    console.error("Error listing vehicles by owner:", error)
    throw new Error("Could not retrieve vehicles")
  }
}

const searchVehicles = async (searchTerm: string) => {
  if (!searchTerm) {
    throw new Error('Search term is required')
  }

  const scanCommand = new ScanCommand({
    TableName: VEHICLES_TABLE,
    FilterExpression: 'contains(#make, :searchTerm) OR contains(#model, :searchTerm) OR contains(#licensePlate, :searchTerm) OR contains(#vin, :searchTerm)',
    ExpressionAttributeNames: {
      '#make': 'make',
      '#model': 'model',
      '#licensePlate': 'licensePlate',
      '#vin': 'vin'
    },
    ExpressionAttributeValues: {
      ':searchTerm': { S: searchTerm }
    }
  })

  try {
    const result = await dynamoDBClient.send(scanCommand)
    return result.Items?.map(item => mapFromDynamodbAttributes(item)) || []
  } catch (error) {
    console.error("Error searching vehicles:", error)
    throw new Error("Could not search vehicles")
  }
}

const mapFromDynamodbAttributes = (item: Record<string, any>): Record<string, any> => {
  const mapped: Record<string, any> = {}

  Object.entries(item).forEach(([key, value]) => {
    if (value.S) {
      mapped[key] = value.S
    } else if (value.N) {
      mapped[key] = parseInt(value.N)
    } else if (value.BOOL !== undefined) {
      mapped[key] = value.BOOL
    } else if (value.L) {
      mapped[key] = value.L.map((v: any) => mapFromDynamodbAttributes(v))
    } else if (value.M) {
      mapped[key] = mapFromDynamodbAttributes(value.M)
    }
  })

  return mapped
} 