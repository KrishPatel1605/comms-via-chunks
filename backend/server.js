// Required dependencies: 
// npm install express cors body-parser cloudinary dotenv mongoose

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Large limit for Base64 chunks

// ==================== MONGODB SETUP ====================
// Connect to MongoDB (Replace URI with your actual connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/site-monitor';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define the Schema
const SiteUpdateSchema = new mongoose.Schema({
  sliderValue: { type: Number, required: true },
  imageUrl: { type: String }, // Stores the Cloudinary URL or Base64 fallback
  source: { type: String, default: 'site_engineer' },
  uploadId: { type: String },
  createdAt: { type: Date, default: Date.now } // Automatically stores date & time
});

// Create the Model
const SiteUpdate = mongoose.model('SiteUpdate', SiteUpdateSchema);

// ==================== CLOUDINARY CONFIG ====================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==================== MEMORY STORAGE (CHUNKS) ====================
// We still use memory for chunks because they are temporary.
// Only the final result gets saved to MongoDB.
const chunkStorage = new Map();

// ==================== CHUNK UTILITIES ====================
function storeChunk(uploadId, chunkIndex, payload, totalChunks) {
  if (!chunkStorage.has(uploadId)) {
    chunkStorage.set(uploadId, {
      chunks: new Map(),
      totalChunks: totalChunks,
      receivedCount: 0,
      lastActivity: Date.now()
    });
  }

  const upload = chunkStorage.get(uploadId);
  
  if (!upload.chunks.has(chunkIndex)) {
    upload.chunks.set(chunkIndex, payload);
    upload.receivedCount++;
    upload.lastActivity = Date.now();
  }

  return {
    received: upload.receivedCount,
    total: upload.totalChunks,
    complete: upload.receivedCount === upload.totalChunks
  };
}

function reconstructJSON(uploadId) {
  const upload = chunkStorage.get(uploadId);
  if (!upload || upload.receivedCount !== upload.totalChunks) {
    throw new Error('Upload incomplete or not found');
  }

  const sortedChunks = Array.from(upload.chunks.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, payload]) => payload);

  const fullString = sortedChunks.join('');
  try {
    return JSON.parse(fullString);
  } catch (error) {
    throw new Error('Failed to parse reconstructed JSON');
  }
}

// Cleanup stale chunks every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of chunkStorage.entries()) {
    if (now - data.lastActivity > 1000 * 60 * 30) { // 30 mins
      chunkStorage.delete(id);
    }
  }
}, 1000 * 60 * 10);

// ==================== API ENDPOINTS ====================

// 1. Upload Chunk
app.post('/upload-chunk', async (req, res) => {
  const { uploadId, chunkIndex, totalChunks, payload } = req.body;

  if (!uploadId || chunkIndex === undefined || !payload) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  console.log(`Packet ${chunkIndex}/${totalChunks - 1} for ${uploadId}`);

  try {
    const status = storeChunk(uploadId, chunkIndex, payload, totalChunks);

    if (status.complete) {
      console.log(`📦 Upload ${uploadId} complete. Reconstructing...`);
      let reconstructedData = reconstructJSON(uploadId);
      let finalImageUrl = null;

      // --- Handle Image Upload to Cloudinary ---
      if (reconstructedData.imageBase64) {
        console.log('☁️ Uploading image to Cloudinary...');
        try {
          if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error("Cloudinary config missing");

          const uploadResponse = await cloudinary.uploader.upload(reconstructedData.imageBase64, {
            folder: "site_engineer_updates",
            resource_type: "auto"
          });
          
          finalImageUrl = uploadResponse.secure_url;
          console.log(`✅ Image uploaded: ${finalImageUrl}`);
        } catch (cloudError) {
          console.warn(`⚠️ Cloudinary failed, using Base64 fallback: ${cloudError.message}`);
          finalImageUrl = reconstructedData.imageBase64; // Fallback
        }
      }

      // --- SAVE TO MONGODB ---
      console.log('💾 Saving to MongoDB...');
      const newUpdate = new SiteUpdate({
        sliderValue: reconstructedData.sliderValue,
        imageUrl: finalImageUrl,
        source: reconstructedData.source || 'site_engineer',
        uploadId: uploadId,
        createdAt: new Date() // Explicitly set time
      });

      await newUpdate.save();
      console.log('✅ Document saved to MongoDB');

      // Cleanup memory
      chunkStorage.delete(uploadId);

      return res.json({ success: true, message: 'Data saved to MongoDB', complete: true });
    }

    res.json({ success: true, message: 'Chunk received', complete: false });

  } catch (error) {
    console.error('Error processing chunk:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Upload Status (for resuming uploads)
app.get('/upload-status', (req, res) => {
  const { uploadId } = req.query;
  const upload = chunkStorage.get(uploadId);
  const receivedChunks = upload ? Array.from(upload.chunks.keys()) : [];
  res.json({
    receivedChunks,
    totalChunks: upload ? upload.totalChunks : 0
  });
});

// 3. Get Latest Value (Fetched from MongoDB)
app.get('/latest-value', async (req, res) => {
  try {
    // Find the most recent entry
    const latest = await SiteUpdate.findOne().sort({ createdAt: -1 });
    
    if (latest) {
      res.json({
        sliderValue: latest.sliderValue,
        timestamp: latest.createdAt,
        imageUrl: latest.imageUrl,
        source: latest.source
      });
    } else {
      res.json({}); // No data yet
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// 4. Get History (Optional utility)
app.get('/history', async (req, res) => {
  try {
    const history = await SiteUpdate.find().sort({ createdAt: -1 }).limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});