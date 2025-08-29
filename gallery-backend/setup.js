#!/usr/bin/env node

// Setup script to initialize AWS resources
require('dotenv').config();
const AWSSetup = require('./config/aws-setup');

async function main() {
  console.log('🎯 GFPL Gallery System Setup');
  console.log('============================');
  
  // Check required environment variables
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'S3_BUCKET_NAME',
    'DYNAMODB_TABLE_NAME'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease check your .env file and try again.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  console.log(`📍 Region: ${process.env.AWS_REGION}`);
  console.log(`🪣 S3 Bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`🗄️  DynamoDB Table: ${process.env.DYNAMODB_TABLE_NAME}`);
  console.log('');
  
  try {
    await AWSSetup.setupAll();
    
    console.log('');
    console.log('🎉 Setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm start');
    console.log('2. Open: http://localhost:3000/admin');
    console.log('3. Login with your admin credentials');
    console.log('4. Create gallery sections and upload images');
    console.log('');
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}