#!/bin/bash

# Vehicle Microservice Deployment Script
# This script deploys the vehicle microservice infrastructure and CI/CD pipeline

set -e  # Exit on any error

echo "🚗 Starting Vehicle Microservice Deployment..."

# Check if AWS profile is set
if [ -z "$AWS_PROFILE" ]; then
    echo "❌ Setting AWS_PROFILE to tcad"
    export AWS_PROFILE=tcad
fi

echo "✅ Using AWS Profile: $AWS_PROFILE"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "cdk.json" ]; then
    echo "❌ Please run this script from the ms-vehicles directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building TypeScript..."
npm run build

# Synthesize CDK
echo "🏗️  Synthesizing CDK..."
npx cdk synth

# Deploy Pipeline Stack
echo "🔗 Deploying CI/CD Pipeline Stack..."
npx cdk deploy VehiclesPipelineStack --require-approval never

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Lambda Function: ms-vehicles-lambda"
echo "   - DynamoDB Table: vehicles"
echo "   - CI/CD Pipeline: VehiclesPipeline"
echo ""
echo "🔍 Next Steps:"
echo "   1. Ensure the 'vehicles' DynamoDB table exists with 'id' as primary key"
echo "   2. Push your code to the GitHub repository: tcad-admin/ms-vehicles"
echo "   3. The CI/CD pipeline will automatically deploy future changes"
echo ""
echo "📚 For more information, see README.md" 