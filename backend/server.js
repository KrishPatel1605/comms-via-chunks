// Backend Server - Node.js + Express + Cloudinary
// Install: npm install express cors body-parser cloudinary dotenv

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
// Increased limit to 50mb to handle large Base64 chunks if needed
app.use(bodyParser.json({ limit: '50mb' })); 

// ==================== CLOUDINARY CONFIG ====================
// Note: If these are not set, the app will fall back to storing 
// the Base64 string directly in memory so the demo still works.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==================== STORAGE ====================
const chunkStorage = new Map();

const centralDatabase = {
  latestSliderValue: null,
  history: []
};

// ==================== CHUNK MANAGEMENT ====================

function storeChunk(uploadId, chunkIndex, payload, totalChunks) {
  if (!chunkStorage.has(uploadId)) {
    chunkStorage.set(uploadId, {
      chunks: new Map(),
      totalChunks: totalChunks,
      receivedCount: 0,
      createdAt: Date.now()
    });
  }

  const upload = chunkStorage.get(uploadId);
  
  if (!upload.chunks.has(chunkIndex)) {
    upload.chunks.set(chunkIndex, payload);
    upload.receivedCount++;
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

// ==================== API ENDPOINTS ====================

app.post('/upload-chunk', async (req, res) => {
  const { uploadId, chunkIndex, totalChunks, payload } = req.body;

  if (!uploadId || chunkIndex === undefined || !payload) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  console.log(`Received chunk ${chunkIndex}/${totalChunks - 1} for ${uploadId}`);

  try {
    const status = storeChunk(uploadId, chunkIndex, payload, totalChunks);

    if (status.complete) {
      console.log(`Upload ${uploadId} complete. Reconstructing...`);
      
      let reconstructedData = reconstructJSON(uploadId);
      
      // ==================== IMAGE PROCESSING ====================
      // Check if payload contains an image to upload to Cloudinary
      if (reconstructedData.imageBase64) {
        console.log('Image detected. Attempting Cloudinary upload...');
        
        try {
          // Check if Cloudinary is actually configured
          if (!process.env.CLOUDINARY_CLOUD_NAME) {
            throw new Error("Cloudinary not configured");
          }

          const uploadResponse = await cloudinary.uploader.upload(reconstructedData.imageBase64, {
            folder: "site_engineer_updates",
            resource_type: "auto"
          });
          
          console.log(`Cloudinary Upload Success: ${uploadResponse.secure_url}`);
          reconstructedData.imageUrl = uploadResponse.secure_url;

        } catch (cloudError) {
          console.warn(`Cloudinary upload skipped/failed (${cloudError.message}). Using Base64 fallback.`);
          // Fallback: Use the raw base64 string as the image URL
          // This ensures the demo works even without API keys
          reconstructedData.imageUrl = reconstructedData.imageBase64;
        }

        // Remove the heavy base64 string from memory to keep DB light
        // (unless we are using it as the fallback)
        if (reconstructedData.imageUrl !== reconstructedData.imageBase64) {
           delete reconstructedData.imageBase64;
        }
      }
      // ==========================================================

      // Save to "Database"
      centralDatabase.latestSliderValue = {
        sliderValue: reconstructedData.sliderValue,
        timestamp: reconstructedData.timestamp,
        source: reconstructedData.source,
        imageUrl: reconstructedData.imageUrl, // URL or Base64
        uploadId: uploadId
      };

      chunkStorage.delete(uploadId); // Cleanup

      return res.json({ success: true, message: 'Upload complete', complete: true });
    }

    res.json({ success: true, message: 'Chunk received', complete: false });

  } catch (error) {
    console.error('Error processing chunk:', error);
    res.status(500).json({ error: error.message });
  }
});

// Existing helper endpoints
app.get('/upload-status', (req, res) => {
  const { uploadId } = req.query;
  const upload = chunkStorage.get(uploadId);
  const receivedChunks = upload ? Array.from(upload.chunks.keys()) : [];
  res.json({
    receivedChunks,
    totalChunks: upload ? upload.totalChunks : 0
  });
});

app.get('/latest-value', (req, res) => {
  res.json(centralDatabase.latestSliderValue || {});
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});