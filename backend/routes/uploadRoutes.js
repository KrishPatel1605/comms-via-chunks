const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const SiteUpdate = require('../models/SiteUpdate');
const { storeChunk, reconstructJSON, getUploadStatus, deleteUpload } = require('../utils/chunkStorage');

// POST /upload-chunk
router.post('/upload-chunk', async (req, res) => {
  const { uploadId, chunkIndex, totalChunks, payload } = req.body;

  if (!uploadId || chunkIndex === undefined || payload === undefined) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  console.log(`Packet ${chunkIndex}/${totalChunks - 1} for ${uploadId}`);

  try {
    const status = storeChunk(uploadId, chunkIndex, payload, totalChunks);

    if (status.complete) {
      console.log(`Upload ${uploadId} complete. Reconstructing...`);
      let reconstructedData = reconstructJSON(uploadId);
      let finalImageUrl = null;

      if (reconstructedData.imageBase64) {
        console.log('Uploading image to Cloudinary...');
        try {
          if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Cloudinary config missing');

          const uploadResponse = await cloudinary.uploader.upload(reconstructedData.imageBase64, {
            folder: 'site_engineer_updates',
            resource_type: 'auto'
          });

          finalImageUrl = uploadResponse.secure_url;
          console.log(`Image uploaded: ${finalImageUrl}`);
        } catch (cloudError) {
          console.warn(`Cloudinary failed, using Base64 fallback: ${cloudError.message}`);
          finalImageUrl = reconstructedData.imageBase64;
        }
      }

      const newUpdate = new SiteUpdate({
        sliderValue: reconstructedData.sliderValue,
        imageUrl: finalImageUrl,
        source: reconstructedData.source || 'site_engineer',
        uploadId: uploadId,
        createdAt: new Date()
      });

      await newUpdate.save();
      console.log('Document saved to MongoDB');

      // Cleanup memory
      deleteUpload(uploadId);

      return res.json({ success: true, message: 'Data saved to MongoDB', complete: true });
    }

    res.json({ success: true, message: 'Chunk received', complete: false });
  } catch (error) {
    console.error('Error processing chunk:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /upload-status
router.get('/upload-status', (req, res) => {
  const { uploadId } = req.query;
  const receivedChunks = getUploadStatus(uploadId);
  res.json({ receivedChunks, totalChunks: receivedChunks.length ? undefined : 0 });
});

// GET /latest-value
router.get('/latest-value', async (req, res) => {
  try {
    const latest = await SiteUpdate.findOne().sort({ createdAt: -1 });
    if (latest) {
      res.json({ sliderValue: latest.sliderValue, timestamp: latest.createdAt, imageUrl: latest.imageUrl, source: latest.source });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// GET /history
router.get('/history', async (req, res) => {
  try {
    const history = await SiteUpdate.find().sort({ createdAt: -1 }).limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
