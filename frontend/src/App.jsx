import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Upload, RefreshCw } from 'lucide-react';

const CHUNK_SIZE = 2048; // 2KB chunks for demo
const API_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3001' 
  : 'https://comms-via-chunks.onrender.com'; // Replace with your actual backend URL

// Utility functions for chunking
const chunkString = (str, size) => {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.substring(i, i + size));
  }
  return chunks;
};

const generateUploadId = () => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Chunked upload manager
const uploadChunkedData = async (data, onProgress) => {
  const uploadId = generateUploadId();
  const jsonString = JSON.stringify(data);
  const chunks = chunkString(jsonString, CHUNK_SIZE);
  const totalChunks = chunks.length;

  console.log(`Starting upload: ${uploadId}, Total chunks: ${totalChunks}`);

  // Check if there's a previous incomplete upload (resume logic)
  let receivedChunks = [];
  try {
    const statusRes = await fetch(`${API_URL}/upload-status?uploadId=${uploadId}`);
    if (statusRes.ok) {
      const status = await statusRes.json();
      receivedChunks = status.receivedChunks || [];
    }
  } catch (err) {
    console.log('No previous upload found, starting fresh');
  }

  // Send chunks sequentially
  for (let i = 0; i < chunks.length; i++) {
    if (receivedChunks.includes(i)) {
      onProgress(((i + 1) / totalChunks) * 100);
      continue;
    }

    const chunkPacket = {
      uploadId,
      chunkIndex: i,
      totalChunks,
      payload: chunks[i]
    };

    let success = false;
    let retries = 0;
    const maxRetries = 3;

    while (!success && retries < maxRetries) {
      try {
        const response = await fetch(`${API_URL}/upload-chunk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunkPacket)
        });

        if (response.ok) {
          success = true;
          onProgress(((i + 1) / totalChunks) * 100);
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (error) {
        retries++;
        console.error(`Chunk ${i} failed (attempt ${retries}):`, error);
        if (retries >= maxRetries) {
          throw new Error(`Failed to upload chunk ${i} after ${maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  return uploadId;
};

// Site Engineer Page
const SiteEngineerPage = () => {
  const [sliderValue, setSliderValue] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleSliderChange = (e) => {
    setSliderValue(parseInt(e.target.value));
  };

  const adjustValue = (delta) => {
    setSliderValue(prev => Math.max(0, Math.min(100, prev + delta)));
  };

  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);
    setStatus('Uploading...');

    const payload = {
      source: 'site_engineer',
      timestamp: new Date().toISOString(),
      sliderValue: sliderValue,
      metadata: {
        user: 'Site Engineer',
        location: 'Field Site A',
        additionalData: Array(100).fill(0).map((_, i) => ({
          id: i,
          value: Math.random() * 1000
        }))
      }
    };

    try {
      await uploadChunkedData(payload, setProgress);
      setStatus('Upload complete!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-indigo-900 mb-8 flex items-center gap-3">
          <Upload className="w-8 h-8" />
          Site Engineer
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Value: {sliderValue}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={handleSliderChange}
              disabled={uploading}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => adjustValue(-10)}
              disabled={uploading}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              -10%
            </button>
            <button
              onClick={() => adjustValue(10)}
              disabled={uploading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              +10%
            </button>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Send Update
              </>
            )}
          </button>

          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">{progress.toFixed(1)}%</p>
            </div>
          )}

          {status && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
              status.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}>
              {status.includes('Error') ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Office Admin Page
const OfficeAdminPage = () => {
  const [sliderValue, setSliderValue] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('Never');
  const [loading, setLoading] = useState(false);

  const fetchLatestValue = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/latest-value`);
      if (response.ok) {
        const data = await response.json();
        setSliderValue(data.sliderValue || 0);
        setLastUpdate(new Date(data.timestamp).toLocaleString());
      }
    } catch (error) {
      console.error('Failed to fetch latest value:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestValue();
    const interval = setInterval(fetchLatestValue, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-emerald-900 mb-8 flex items-center gap-3">
          <CheckCircle className="w-8 h-8" />
          Office Admin
        </h1>

        <div className="space-y-6">
          <div className="bg-emerald-50 p-6 rounded-lg border-2 border-emerald-200">
            <h2 className="text-lg font-semibold text-emerald-900 mb-4">
              Current Slider Value
            </h2>
            <div className="text-6xl font-bold text-emerald-600 text-center">
              {sliderValue}%
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visual Representation
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              disabled
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed accent-emerald-600"
            />
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Last Updated:</strong> {lastUpdate}</p>
            <p><strong>Status:</strong> {loading ? 'Refreshing...' : 'Live'}</p>
          </div>

          <button
            onClick={fetchLatestValue}
            disabled={loading}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Router
export default function App() {
  const [page, setPage] = useState('engineer');

  return (
    <div>
      <div className="bg-gray-900 text-white p-4 flex justify-center gap-4">
        <button
          onClick={() => setPage('engineer')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            page === 'engineer' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Site Engineer
        </button>
        <button
          onClick={() => setPage('admin')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            page === 'admin' ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Office Admin
        </button>
      </div>

      {page === 'engineer' ? <SiteEngineerPage /> : <OfficeAdminPage />}
    </div>
  );
}