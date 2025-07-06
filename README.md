# Vehicle Management Microservice

A microservice for managing vehicle information with CRUD operations, built with AWS Lambda, DynamoDB, and CDK.

## Features

- **Create Vehicle**: Add new vehicles with comprehensive details
- **Update Vehicle**: Modify existing vehicle information
- **Delete Vehicle**: Remove vehicles from the system
- **Get Vehicle**: Retrieve specific vehicle by ID
- **List All Vehicles**: Get all vehicles in the system
- **List by Status**: Filter vehicles by status (active, inactive, maintenance, etc.)
- **List by Owner**: Filter vehicles by owner ID
- **Search Vehicles**: Search vehicles by make, model, license plate, or VIN

## Vehicle Data Model

```typescript
interface Vehicle {
  id: string                    // Unique identifier (auto-generated)
  make: string                  // Vehicle make (e.g., "Toyota") - REQUIRED
  model: string                 // Vehicle model (e.g., "Camry") - REQUIRED
  color: string                 // Vehicle color (e.g., "Silver") - REQUIRED
  ownerId: string               // Owner ID reference - REQUIRED
  year?: number                 // Manufacturing year (optional)
  licensePlate?: string         // License plate number (optional)
  vin?: string                  // Vehicle Identification Number (optional)
  mileage?: number              // Current mileage (optional)
  fuelType?: string             // Fuel type (gasoline, diesel, electric, etc.) (optional)
  transmission?: string         // Transmission type (automatic, manual) (optional)
  status?: string               // Vehicle type (PRIMARY, SECONDARY, OTHER) (optional)
  notes?: string                // Optional notes
  createdAt: string             // Creation timestamp
  updatedAt: string             // Last update timestamp
}
```

## Available Operations

### 1. Create Vehicle
```graphql
createVehicle(input: CreateVehicleInput!): Vehicle!
```

**Required fields**: make, model, color, ownerId

### 2. Update Vehicle
```graphql
updateVehicle(input: UpdateVehicleInput!): Vehicle!
```

**Required**: id
**Optional**: Any vehicle field to update

### 3. Delete Vehicle
```graphql
deleteVehicle(id: String!): DeleteResponse!
```

### 4. Get Vehicle
```graphql
getVehicle(id: String!): Vehicle!
```

### 5. List All Vehicles
```graphql
listAllVehicles: [Vehicle!]!
```

### 6. List Vehicles by Status
```graphql
listVehiclesByStatus(status: String!): [Vehicle!]!
```

### 7. List Vehicles by Owner
```graphql
listVehiclesByOwner(ownerId: String!): [Vehicle!]!
```

### 8. Search Vehicles
```graphql
searchVehicles(searchTerm: String!): [Vehicle!]!
```

Searches across: make, model, licensePlate, vin

## Prerequisites

- Node.js 20+
- AWS CLI configured with `tcad` profile
- AWS CDK installed globally
- DynamoDB table named `vehicles` with `id` as the primary key

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set AWS profile**:
   ```bash
   export AWS_PROFILE=tcad
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Deploy the infrastructure**:
   ```bash
   npx cdk deploy VehiclesLambdaStack
   ```

5. **Deploy the CI/CD pipeline**:
   ```bash
   npx cdk deploy VehiclesPipelineStack
   ```

## Development

### Local Development

1. **Build TypeScript**:
   ```bash
   npm run build
   ```

2. **Synthesize CDK**:
   ```bash
   npx cdk synth
   ```

### Testing

The microservice can be tested through AWS AppSync or directly via Lambda invocations.

Example Lambda test event:
```json
{
  "info": {
    "fieldName": "createVehicle"
  },
  "arguments": {
    "input": {
      "make": "Toyota",
      "model": "Camry",
      "color": "Silver",
      "ownerId": "user123",
      "year": 2023,
      "licensePlate": "ABC123",
      "vin": "1HGBH41JXMN109186",
      "mileage": 15000,
      "fuelType": "gasoline",
      "transmission": "automatic",
      "status": "PRIMARY"
    }
  }
}
```

## CI/CD Pipeline

The service includes a complete CI/CD pipeline that:

1. **Source Stage**: Pulls code from GitHub repository (`tcad-admin/ms-vehicles`)
2. **Build Stage**: Installs dependencies, builds TypeScript, and synthesizes CDK
3. **Deploy Stage**: Deploys the Lambda function and infrastructure

### Pipeline Components

- **GitHub Source**: Connects to the repository using OAuth token from AWS Secrets Manager
- **CodeBuild Project**: Builds and packages the Lambda function
- **CloudFormation**: Deploys the infrastructure stack

## Infrastructure

### AWS Resources

- **Lambda Function**: `ms-vehicles-lambda` - Main business logic
- **DynamoDB Table**: `vehicles` - Data storage
- **IAM Roles**: Permissions for Lambda to access DynamoDB
- **CodePipeline**: CI/CD pipeline for automated deployments
- **CodeBuild**: Build environment for packaging

### Environment Variables

- `VEHICLES_TABLE`: DynamoDB table name for vehicle data

## Error Handling

The microservice includes comprehensive error handling:

- **Validation Errors**: Missing required fields, invalid data types
- **Not Found Errors**: Vehicle doesn't exist
- **Database Errors**: DynamoDB operation failures
- **General Errors**: Unexpected errors with proper logging

## Monitoring and Logging

- All operations are logged to CloudWatch
- Error details are captured for debugging
- Performance metrics are available through CloudWatch

## Security

- IAM roles with least privilege access
- DynamoDB table access restricted to Lambda function
- Environment variables for configuration
- Input validation and sanitization

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Push to GitHub
5. The CI/CD pipeline will automatically deploy changes

## Support

For issues or questions, please contact the development team or create an issue in the repository. 