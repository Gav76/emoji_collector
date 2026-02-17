#!/bin/bash

# Emoji Collector - Deployment Script
# Deploys the application to AWS S3 + CloudFront in eu-central-1

set -e

REGION="eu-central-1"
STACK_NAME="emoji-collector-stack"

echo "🎮 Emoji Collector - AWS Deployment Script"
echo "==========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "✓ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✓ AWS Account: $ACCOUNT_ID"
echo ""

# Build the application
echo "📦 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✓ Build complete"
echo ""

# Deploy CloudFormation stack
echo "☁️  Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --region $REGION \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset

if [ $? -ne 0 ]; then
    echo "❌ CloudFormation deployment failed"
    exit 1
fi
echo "✓ CloudFormation stack deployed"
echo ""

# Get bucket name from stack outputs
echo "📋 Getting stack outputs..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text)

echo "✓ Bucket: $BUCKET_NAME"
echo "✓ CloudFront ID: $CLOUDFRONT_ID"
echo ""

# Upload files to S3
echo "📤 Uploading files to S3..."
aws s3 sync . s3://$BUCKET_NAME/ \
    --region $REGION \
    --exclude ".git/*" \
    --exclude "node_modules/*" \
    --exclude "src/*" \
    --exclude "tests/*" \
    --exclude "*.ts" \
    --exclude "*.md" \
    --exclude "*.sh" \
    --exclude "*.yaml" \
    --exclude "tsconfig.json" \
    --exclude "jest.config.js" \
    --exclude "package*.json" \
    --delete

if [ $? -ne 0 ]; then
    echo "❌ S3 upload failed"
    exit 1
fi
echo "✓ Files uploaded to S3"
echo ""

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_ID \
    --paths "/*" \
    --region $REGION \
    > /dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  CloudFront invalidation failed (non-critical)"
else
    echo "✓ CloudFront cache invalidated"
fi
echo ""

# Success message
echo "==========================================="
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your Emoji Collector is now live at:"
echo "   $WEBSITE_URL"
echo ""
echo "📝 Note: CloudFront distribution may take 10-15 minutes to fully deploy"
echo "==========================================="
