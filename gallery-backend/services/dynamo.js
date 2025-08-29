const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

class DynamoService {
  // Get all gallery sections
  async getAllSections() {
    try {
      const params = {
        TableName: TABLE_NAME
      };
      const result = await dynamodb.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting sections:', error);
      throw error;
    }
  }

  // Get section by ID
  async getSection(sectionId) {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: { sectionId }
      };
      const result = await dynamodb.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error getting section:', error);
      throw error;
    }
  }

  // Create new section
  async createSection(sectionId, name) {
    try {
      const params = {
        TableName: TABLE_NAME,
        Item: {
          sectionId,
          name,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      await dynamodb.put(params).promise();
      return params.Item;
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  }

  // Add image to section
  async addImageToSection(sectionId, imageId, imageUrl) {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: { sectionId },
        UpdateExpression: 'SET images = list_append(if_not_exists(images, :empty_list), :new_image), updatedAt = :timestamp',
        ExpressionAttributeValues: {
          ':new_image': [{ id: imageId, url: imageUrl }],
          ':empty_list': [],
          ':timestamp': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };
      const result = await dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error adding image to section:', error);
      throw error;
    }
  }

  // Delete section
  async deleteSection(sectionId) {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: { sectionId }
      };
      await dynamodb.delete(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  }

  // Delete image from section
  async deleteImageFromSection(sectionId, imageId) {
    try {
      // First get the section to find the image index
      const section = await this.getSection(sectionId);
      if (!section) throw new Error('Section not found');

      const imageIndex = section.images.findIndex(img => img.id === imageId);
      if (imageIndex === -1) throw new Error('Image not found');

      const params = {
        TableName: TABLE_NAME,
        Key: { sectionId },
        UpdateExpression: `REMOVE images[${imageIndex}] SET updatedAt = :timestamp`,
        ExpressionAttributeValues: {
          ':timestamp': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };
      const result = await dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error deleting image from section:', error);
      throw error;
    }
  }
}

module.exports = new DynamoService();