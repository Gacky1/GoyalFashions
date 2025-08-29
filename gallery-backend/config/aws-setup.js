// AWS Setup and Configuration Helper
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create AWS service instances
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const documentClient = new AWS.DynamoDB.DocumentClient();

// Setup functions for initial deployment
class AWSSetup {
  // Create S3 bucket if it doesn't exist
  static async createS3Bucket() {
    const bucketName = process.env.S3_BUCKET_NAME;
    
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log(`✅ S3 bucket ${bucketName} already exists`);
    } catch (error) {
      if (error.statusCode === 404) {
        try {
          await s3.createBucket({ 
            Bucket: bucketName,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_REGION
            }
          }).promise();
          
          // Set bucket policy for public read access to images
          const bucketPolicy = {
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${bucketName}/*`
              }
            ]
          };
          
          await s3.putBucketPolicy({
            Bucket: bucketName,
            Policy: JSON.stringify(bucketPolicy)
          }).promise();
          
          console.log(`✅ Created S3 bucket ${bucketName} with public read policy`);
        } catch (createError) {
          console.error('❌ Error creating S3 bucket:', createError);
          throw createError;
        }
      } else {
        console.error('❌ Error checking S3 bucket:', error);
        throw error;
      }
    }
  }

  // Create DynamoDB table if it doesn't exist
  static async createDynamoTable() {
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    
    try {
      await dynamodb.describeTable({ TableName: tableName }).promise();
      console.log(`✅ DynamoDB table ${tableName} already exists`);
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        try {
          const params = {
            TableName: tableName,
            KeySchema: [
              {
                AttributeName: 'sectionId',
                KeyType: 'HASH'
              }
            ],
            AttributeDefinitions: [
              {
                AttributeName: 'sectionId',
                AttributeType: 'S'
              }
            ],
            BillingMode: 'PAY_PER_REQUEST'
          };
          
          await dynamodb.createTable(params).promise();
          
          // Wait for table to be active
          await dynamodb.waitFor('tableExists', { TableName: tableName }).promise();
          
          console.log(`✅ Created DynamoDB table ${tableName}`);
        } catch (createError) {
          console.error('❌ Error creating DynamoDB table:', createError);
          throw createError;
        }
      } else {
        console.error('❌ Error checking DynamoDB table:', error);
        throw error;
      }
    }
  }

  // Setup CloudFront distribution for S3 bucket (optional)
  static async createCloudFrontDistribution() {
    const cloudfront = new AWS.CloudFront();
    const bucketName = process.env.S3_BUCKET_NAME;
    
    try {
      const params = {
        DistributionConfig: {
          CallerReference: `gfpl-gallery-${Date.now()}`,
          Comment: 'GFPL Gallery Images CDN',
          DefaultCacheBehavior: {
            TargetOriginId: bucketName,
            ViewerProtocolPolicy: 'redirect-to-https',
            TrustedSigners: {
              Enabled: false,
              Quantity: 0
            },
            ForwardedValues: {
              QueryString: false,
              Cookies: {
                Forward: 'none'
              }
            },
            MinTTL: 0
          },
          Origins: {
            Quantity: 1,
            Items: [
              {
                Id: bucketName,
                DomainName: `${bucketName}.s3.amazonaws.com`,
                S3OriginConfig: {
                  OriginAccessIdentity: ''
                }
              }
            ]
          },
          Enabled: true
        }
      };
      
      const result = await cloudfront.createDistribution(params).promise();
      console.log(`✅ Created CloudFront distribution: ${result.Distribution.DomainName}`);
      return result.Distribution.DomainName;
    } catch (error) {
      console.error('❌ Error creating CloudFront distribution:', error);
      throw error;
    }
  }

  // Run all setup tasks
  static async setupAll() {
    console.log('🚀 Starting AWS setup...');
    
    try {
      await this.createS3Bucket();
      await this.createDynamoTable();
      console.log('✅ AWS setup completed successfully!');
    } catch (error) {
      console.error('❌ AWS setup failed:', error);
      process.exit(1);
    }
  }
}

module.exports = AWSSetup;