const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

class S3Service {
  // Upload image to S3
  async uploadImage(file, sectionId) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${sectionId}/${uuidv4()}.${fileExtension}`;
      
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read' // Make images publicly accessible
      };

      const result = await s3.upload(params).promise();
      return {
        imageId: uuidv4(),
        url: result.Location,
        key: fileName
      };
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }

  // Delete image from S3
  async deleteImage(imageUrl) {
    try {
      // Extract key from URL
      const key = imageUrl.split(`${BUCKET_NAME}/`)[1];
      
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw error;
    }
  }

  // Delete all images in a section folder
  async deleteSectionImages(sectionId) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Prefix: `${sectionId}/`
      };

      const objects = await s3.listObjectsV2(params).promise();
      
      if (objects.Contents.length > 0) {
        const deleteParams = {
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
          }
        };
        
        await s3.deleteObjects(deleteParams).promise();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting section images from S3:', error);
      throw error;
    }
  }
}

module.exports = new S3Service();