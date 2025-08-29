const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const dynamoService = require('../services/dynamo');
const s3Service = require('../services/s3');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET /api/gallery - Get all gallery sections (public)
router.get('/', async (req, res) => {
  try {
    const sections = await dynamoService.getAllSections();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery data' });
  }
});

// POST /api/gallery/section - Create new section (protected)
router.post('/section', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Section name is required' });
    }

    // Generate section ID from name
    const sectionId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    // Check if section already exists
    const existingSection = await dynamoService.getSection(sectionId);
    if (existingSection) {
      return res.status(400).json({ error: 'Section already exists' });
    }

    const section = await dynamoService.createSection(sectionId, name);
    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// POST /api/gallery/image - Upload image to section (protected)
router.post('/image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { sectionId } = req.body;
    
    if (!sectionId || !req.file) {
      return res.status(400).json({ error: 'Section ID and image file are required' });
    }

    // Check if section exists
    const section = await dynamoService.getSection(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Upload to S3
    const uploadResult = await s3Service.uploadImage(req.file, sectionId);
    
    // Add image to section in DynamoDB
    const updatedSection = await dynamoService.addImageToSection(
      sectionId, 
      uploadResult.imageId, 
      uploadResult.url
    );

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: { id: uploadResult.imageId, url: uploadResult.url },
      section: updatedSection
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// DELETE /api/gallery/section/:id - Delete section (protected)
router.delete('/section/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get section to check if it exists and get images
    const section = await dynamoService.getSection(id);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Delete all images from S3
    await s3Service.deleteSectionImages(id);
    
    // Delete section from DynamoDB
    await dynamoService.deleteSection(id);

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// DELETE /api/gallery/image/:sectionId/:imageId - Delete specific image (protected)
router.delete('/image/:sectionId/:imageId', requireAuth, async (req, res) => {
  try {
    const { sectionId, imageId } = req.params;
    
    // Get section to find image URL
    const section = await dynamoService.getSection(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const image = section.images.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from S3
    await s3Service.deleteImage(image.url);
    
    // Remove from DynamoDB
    const updatedSection = await dynamoService.deleteImageFromSection(sectionId, imageId);

    res.json({ 
      message: 'Image deleted successfully',
      section: updatedSection
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;