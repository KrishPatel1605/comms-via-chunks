/*
Simple in-memory chunk storage utilities. This keeps a Map of uploads where each upload holds a Map of chunkIndex->payload.
This is intended for demo / small-scale usage. For production use, persist intermediate state or use Redis.
*/
const chunkStorage = new Map();

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

function getUploadStatus(uploadId) {
  const upload = chunkStorage.get(uploadId);
  return upload ? Array.from(upload.chunks.keys()) : [];
}

function deleteUpload(uploadId) {
  return chunkStorage.delete(uploadId);
}

// Cleanup stale entries every 10 minutes (stale = 30 minutes of inactivity)
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of chunkStorage.entries()) {
    if (now - data.lastActivity > 1000 * 60 * 30) {
      chunkStorage.delete(id);
    }
  }
}, 1000 * 60 * 10);

module.exports = { storeChunk, reconstructJSON, getUploadStatus, deleteUpload };
