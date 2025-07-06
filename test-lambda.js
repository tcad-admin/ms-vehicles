const { handler } = require('./dist/index.js')

// Test event for creating a vehicle
const createVehicleEvent = {
  info: {
    fieldName: 'createVehicle'
  },
  arguments: {
    input: {
      make: 'Toyota',
      model: 'Camry',
      color: 'Silver',
      ownerId: 'user123',
      year: 2023,
      licensePlate: 'ABC123',
      vin: '1HGBH41JXMN109186',
      mileage: 15000,
      fuelType: 'gasoline',
      transmission: 'automatic',
      status: 'PRIMARY',
      notes: 'Primary family vehicle'
    }
  }
}

// Test event for listing all vehicles
const listVehiclesEvent = {
  info: {
    fieldName: 'listAllVehicles'
  },
  arguments: {}
}

async function testLambda() {
  console.log('🧪 Testing Vehicle Lambda Function...\n')

  try {
    // Test creating a vehicle
    console.log('1. Testing createVehicle...')
    const createResult = await handler(createVehicleEvent)
    console.log('✅ Create Vehicle Result:', JSON.stringify(createResult, null, 2))
    console.log('')

    // Test listing vehicles
    console.log('2. Testing listAllVehicles...')
    const listResult = await handler(listVehiclesEvent)
    console.log('✅ List Vehicles Result:', JSON.stringify(listResult, null, 2))
    console.log('')

    console.log('🎉 All tests completed successfully!')
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testLambda() 