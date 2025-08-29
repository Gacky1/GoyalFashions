# GFPL Gallery Management System

A complete gallery management system with backend API, admin panel, and public gallery page.

## 🏗️ Architecture

- **Backend**: Node.js + Express
- **Database**: AWS DynamoDB
- **Storage**: AWS S3 + CloudFront
- **Authentication**: Basic Auth with environment variables
- **Frontend**: Vanilla HTML/CSS/JS with Swiper.js

## 📦 Project Structure

```
gallery-backend/
├── server.js              # Main Express server
├── routes/
│   └── gallery.js         # Gallery API routes
├── middleware/
│   └── auth.js            # Authentication middleware
├── services/
│   ├── dynamo.js          # DynamoDB operations
│   └── s3.js              # S3 operations
├── config/
│   └── aws-setup.js       # AWS configuration
├── package.json
├── .env.example
└── README.md

admin/
└── index.html             # Admin panel

gallery.html               # Public gallery page
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd gallery-backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=gfpl-gallery-images

# DynamoDB
DYNAMODB_TABLE_NAME=gfpl-gallery-sections

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. AWS Setup

#### Create S3 Bucket
```bash
aws s3 mb s3://gfpl-gallery-images --region us-east-1
```

#### Create DynamoDB Table
```bash
aws dynamodb create-table \
    --table-name gfpl-gallery-sections \
    --attribute-definitions AttributeName=sectionId,AttributeType=S \
    --key-schema AttributeName=sectionId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 4. Run Development Server

```bash
npm run dev
```

- API: http://localhost:3000/api/gallery
- Admin Panel: http://localhost:3000/admin
- Health Check: http://localhost:3000/health

## 🌐 Deployment Options

### Option 1: AWS Lambda + API Gateway (Serverless)

1. **Install Serverless Framework**
```bash
npm install -g serverless
```

2. **Create serverless.yml**
```yaml
service: gfpl-gallery-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    ADMIN_USERNAME: ${env:ADMIN_USERNAME}
    ADMIN_PASSWORD: ${env:ADMIN_PASSWORD}
    AWS_ACCESS_KEY_ID: ${env:AWS_ACCESS_KEY_ID}
    AWS_SECRET_ACCESS_KEY: ${env:AWS_SECRET_ACCESS_KEY}
    S3_BUCKET_NAME: ${env:S3_BUCKET_NAME}
    DYNAMODB_TABLE_NAME: ${env:DYNAMODB_TABLE_NAME}

functions:
  api:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
```

3. **Create lambda.js**
```javascript
const serverless = require('serverless-http');
const app = require('./server');

module.exports.handler = serverless(app);
```

4. **Deploy**
```bash
serverless deploy
```

### Option 2: AWS Elastic Beanstalk

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize EB Application**
```bash
eb init gfpl-gallery-api --region us-east-1 --platform node.js
```

3. **Create Environment**
```bash
eb create production
```

4. **Set Environment Variables**
```bash
eb setenv ADMIN_USERNAME=admin ADMIN_PASSWORD=your_password AWS_ACCESS_KEY_ID=your_key AWS_SECRET_ACCESS_KEY=your_secret S3_BUCKET_NAME=gfpl-gallery-images DYNAMODB_TABLE_NAME=gfpl-gallery-sections
```

5. **Deploy**
```bash
eb deploy
```

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/gallery` - Get all gallery sections

### Protected Endpoints (Require Basic Auth)
- `POST /api/gallery/section` - Create new section
- `POST /api/gallery/image` - Upload image to section
- `DELETE /api/gallery/section/:id` - Delete section
- `DELETE /api/gallery/image/:sectionId/:imageId` - Delete image

## 🛡️ Security

- Basic Authentication for admin operations
- File type validation (images only)
- File size limits (5MB)
- S3 bucket with public read access for images
- Environment-based configuration

## 📱 Admin Panel Features

- Login with username/password
- Create/delete gallery sections
- Upload multiple images (drag & drop supported)
- Delete individual images
- Real-time preview of changes

## 🎨 Frontend Integration

Update the API_BASE_URL in both `gallery.html` and `admin/index.html`:

```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

## 🔍 Monitoring

- Health check endpoint: `/health`
- AWS CloudWatch logs (for Lambda/EB deployments)
- S3 access logs
- DynamoDB metrics

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS is properly configured in server.js
2. **S3 Upload Fails**: Check AWS credentials and bucket permissions
3. **DynamoDB Errors**: Verify table exists and credentials have proper permissions
4. **Authentication Issues**: Check ADMIN_USERNAME and ADMIN_PASSWORD in environment

### AWS Permissions Required

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::gfpl-gallery-images",
                "arn:aws:s3:::gfpl-gallery-images/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Scan"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:*:table/gfpl-gallery-sections"
        }
    ]
}
```

## 📞 Support

For issues or questions, contact the development team or refer to AWS documentation for service-specific troubleshooting.