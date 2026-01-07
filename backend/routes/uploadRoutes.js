const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const SiteUpdate = require('../models/SiteUpdate');
const Task = require('../models/Task');
const MaterialRequest = require('../models/MaterialRequest'); // New Model
const { storeChunk, reconstructJSON, getUploadStatus, deleteUpload } = require('../utils/chunkStorage');

// --- Site Photo & Progress Logic ---

router.post('/upload-chunk', async (req, res) => {
  const { uploadId, chunkIndex, totalChunks, payload } = req.body;
  if (!uploadId || chunkIndex === undefined || payload === undefined) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const status = storeChunk(uploadId, chunkIndex, payload, totalChunks);

    if (status.complete) {
      let reconstructedData = reconstructJSON(uploadId);
      let finalImageUrl = null;

      if (reconstructedData.imageBase64) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(reconstructedData.imageBase64, {
            folder: 'site_engineer_updates',
            resource_type: 'auto'
          });
          finalImageUrl = uploadResponse.secure_url;
        } catch (cloudError) {
          finalImageUrl = reconstructedData.imageBase64;
        }
      }

      const newUpdate = new SiteUpdate({
        sliderValue: reconstructedData.sliderValue,
        imageUrl: finalImageUrl,
        source: reconstructedData.source || 'site_engineer',
        uploadId: uploadId
      });

      await newUpdate.save();
      deleteUpload(uploadId);
      return res.json({ success: true, complete: true });
    }
    res.json({ success: true, complete: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/latest-value', async (req, res) => {
  try {
    const latest = await SiteUpdate.findOne().sort({ createdAt: -1 });
    res.json(latest ? {
      sliderValue: latest.sliderValue,
      timestamp: latest.createdAt,
      imageUrl: latest.imageUrl
    } : {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// --- Task Management Routes ---

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    if (!req.body.description) return res.status(400).json({ error: 'Description required' });
    const task = new Task({ description: req.body.description });
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Material Requisition Routes (New) ---

// Fetch all material requests
router.get('/materials', async (req, res) => {
  try {
    const requests = await MaterialRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new material request (Used by Site Engineer)
router.post('/materials', async (req, res) => {
  try {
    const { name, qty } = req.body;
    if (!name || !qty) return res.status(400).json({ error: 'Name and Qty required' });
    const request = new MaterialRequest({ name, qty });
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update material status (Approved/Rejected - Used by Admin)
router.patch('/materials/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const request = await MaterialRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;