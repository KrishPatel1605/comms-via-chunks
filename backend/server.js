// Backend Server - Node.js + Express
// Save as: server.js
// Install: npm install express cors body-parser

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// ==================== STORAGE ====================
// Temporary chunk storage (in-memory buffer)
const chunkStorage = new Map();

// Central database simulation (single centralized storage)
const centralDatabase = {
  latestSliderValue: null,
  history: []
};

// ==================== CHUNK MANAGEMENT ====================

// Store a chunk temporarily
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
  
  // Avoid duplicate chunks
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

// Reconstruct JSON from chunks
function reconstructJSON(uploadId) {
  const upload = chunkStorage.get(uploadId);
  
  if (!upload) {
    throw new Error('Upload not found');
  }

  if (upload.receivedCount !== upload.totalChunks) {
    throw new Error('Not all chunks received');
  }

  // Sort chunks by index
  const sortedChunks = Array.from(upload.chunks.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, payload]) => payload);

  // Concatenate payloads
  const fullString = sortedChunks.join('');

  // Parse back to JSON
  try {
    const jsonObject = JSON.parse(fullString);
    return jsonObject;
  } catch (error) {
    throw new Error('Failed to parse reconstructed JSON: ' + error.message);
  }
}

// Clean up temporary chunks
function cleanupChunks(uploadId) {
  chunkStorage.delete(uploadId);
}

// Get received chunk indices
function getReceivedChunks(uploadId) {
  const upload = chunkStorage.get(uploadId);
  if (!upload) {
    return [];
  }
  return Array.from(upload.chunks.keys()).sort((a, b) => a - b);
}

// ==================== VALIDATION ====================

function validateChunk(chunkPacket) {
  const required = ['uploadId', 'chunkIndex', 'totalChunks', 'payload'];
  for (const field of required) {
    if (!(field in chunkPacket)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  if (typeof chunkPacket.chunkIndex !== 'number' || chunkPacket.chunkIndex < 0) {
    return { valid: false, error: 'Invalid chunkIndex' };
  }

  if (typeof chunkPacket.totalChunks !== 'number' || chunkPacket.totalChunks <= 0) {
    return { valid: false, error: 'Invalid totalChunks' };
  }

  if (chunkPacket.chunkIndex >= chunkPacket.totalChunks) {
    return { valid: false, error: 'chunkIndex exceeds totalChunks' };
  }

  return { valid: true };
}

// ==================== API ENDPOINTS ====================

// Endpoint 1: Receive chunk
app.post('/upload-chunk', (req, res) => {
  const chunkPacket = req.body;

  // Validate chunk packet
  const validation = validateChunk(chunkPacket);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { uploadId, chunkIndex, totalChunks, payload } = chunkPacket;

  console.log(`Received chunk ${chunkIndex}/${totalChunks - 1} for upload ${uploadId}`);

  try {
    // Store chunk temporarily
    const status = storeChunk(uploadId, chunkIndex, payload, totalChunks);

    // Check if upload is complete
    if (status.complete) {
      console.log(`Upload ${uploadId} complete, reconstructing...`);

      // Reconstruct JSON
      const reconstructedData = reconstructJSON(uploadId);

      // Validate integrity (optional checksum verification)
      console.log('Reconstructed data:', reconstructedData);

      // Commit to central database ONLY after full reconstruction
      if (reconstructedData.sliderValue !== undefined) {
        centralDatabase.latestSliderValue = {
          sliderValue: reconstructedData.sliderValue,
          timestamp: reconstructedData.timestamp,
          source: reconstructedData.source,
          uploadId: uploadId
        };

        centralDatabase.history.push({
          ...centralDatabase.latestSliderValue,
          committedAt: new Date().toISOString()
        });

        console.log(`✓ Committed to central database: ${reconstructedData.sliderValue}%`);
      }

      // Clean up temporary chunks
      cleanupChunks(uploadId);

      return res.json({
        success: true,
        message: 'Upload complete and committed',
        received: status.received,
        total: status.total
      });
    }

    // Chunk received but upload not yet complete
    res.json({
      success: true,
      message: 'Chunk received',
      received: status.received,
      total: status.total
    });

  } catch (error) {
    console.error('Error processing chunk:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Check upload status (for resume functionality)
app.get('/upload-status', (req, res) => {
  const { uploadId } = req.query;

  if (!uploadId) {
    return res.status(400).json({ error: 'uploadId required' });
  }

  const receivedChunks = getReceivedChunks(uploadId);
  const upload = chunkStorage.get(uploadId);

  res.json({
    uploadId,
    receivedChunks,
    totalChunks: upload ? upload.totalChunks : 0,
    complete: upload ? upload.receivedCount === upload.totalChunks : false
  });
});

// Endpoint 3: Get latest value (for Office Admin page)
app.get('/latest-value', (req, res) => {
  if (!centralDatabase.latestSliderValue) {
    return res.json({
      sliderValue: 0,
      timestamp: new Date().toISOString(),
      message: 'No data yet'
    });
  }

  res.json(centralDatabase.latestSliderValue);
});

// Endpoint 4: Get history (optional)
app.get('/history', (req, res) => {
  res.json({
    count: centralDatabase.history.length,
    history: centralDatabase.history.slice(-50) // Last 50 entries
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeUploads: chunkStorage.size,
    databaseEntries: centralDatabase.history.length,
    latestValue: centralDatabase.latestSliderValue?.sliderValue || null
  });
});

// Cleanup old incomplete uploads (run every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 minutes

  for (const [uploadId, upload] of chunkStorage.entries()) {
    if (now - upload.createdAt > timeout) {
      console.log(`Cleaning up stale upload: ${uploadId}`);
      chunkStorage.delete(uploadId);
    }
  }
}, 5 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Chunked JSON Upload Server                           ║
║  Status: RUNNING                                       ║
║  Port: ${PORT}                                            ║
╚════════════════════════════════════════════════════════╝

Available Endpoints:
  POST   /upload-chunk       - Receive JSON chunks
  GET    /upload-status      - Check upload progress
  GET    /latest-value       - Get current slider value
  GET    /history            - Get update history
  GET    /health             - Server health check

Ready to accept chunked uploads!
  `);
});