# Vehicle Microservice - Changelog

## Version 1.0.0 - Updated Requirements

### Changes Made

#### Required Fields Update
- **Before**: Required fields were make, model, year, licensePlate, vin, color, mileage, fuelType, transmission, status
- **After**: Only make, model, color, and ownerId are required
- **Impact**: All other fields are now optional, making the API more flexible while ensuring vehicle ownership is tracked

#### Status Field Update
- **Before**: Status tracked vehicle condition (active, inactive, maintenance, out_of_service, sold)
- **After**: Status tracks vehicle type (PRIMARY, SECONDARY, OTHER)
- **Impact**: Better reflects the business use case of categorizing vehicles by importance/usage

### Files Modified

1. **lambda/src/index.ts**
   - Updated `CreateVehicleInput` interface to make make, model, color, and ownerId required
   - Updated `UpdateVehicleInput` interface to reorder fields
   - Modified `createVehicle` function validation logic
   - Updated DynamoDB item creation to handle optional fields conditionally
   - Updated return object structure

2. **schema.graphql**
   - Updated Vehicle type to make make, model, color, and ownerId required
   - Updated CreateVehicleInput to reflect new requirements
   - Changed VehicleStatus enum values to PRIMARY, SECONDARY, OTHER

3. **test-events.json**
   - Updated test events to use new status values (PRIMARY, SECONDARY)
   - Reordered fields to match new structure
   - Updated example data to reflect new requirements

4. **test-lambda.js**
   - Updated test event to use new field structure
   - Changed status from 'active' to 'PRIMARY'

5. **README.md**
   - Updated Vehicle data model documentation
   - Changed required fields documentation
   - Updated example test event
   - Added clear indication of which fields are required vs optional

### Benefits

1. **Simplified Onboarding**: Users can create vehicles with minimal information
2. **Flexible Data Entry**: Optional fields can be added later as needed
3. **Better Categorization**: Status now reflects vehicle importance rather than condition
4. **Improved UX**: Less friction when adding new vehicles to the system
5. **Ownership Tracking**: All vehicles are properly associated with their owners

### Migration Notes

- Existing vehicles in the database will continue to work
- The status field values should be updated to use the new enum values
- Applications consuming this API should be updated to handle the new field requirements

### Testing

- All TypeScript compilation passes
- CDK synthesis successful
- Test events updated to reflect new structure
- Ready for deployment 