import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Upload, RefreshCw, Image as ImageIcon, X, Map } from 'lucide-react';

// Increased chunk size to 50KB for better image performance
const CHUNK_SIZE = 1024 * 50;

const API_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3001'
  : 'https://comms-via-chunks.onrender.com';

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

// Convert file to Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Chunked upload manager
const uploadChunkedData = async (data, onProgress) => {
  const uploadId = generateUploadId();
  const jsonString = JSON.stringify(data);
  const chunks = chunkString(jsonString, CHUNK_SIZE);
  const totalChunks = chunks.length;

  console.log(`Starting upload: ${uploadId}, Total chunks: ${totalChunks}, Total Size: ${(jsonString.length / 1024).toFixed(2)} KB`);

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
        await new Promise(resolve => setTimeout(resolve, 500 * retries));
      }
    }
  }

  return uploadId;
};

// --- COMPONENTS ---

// 1. Map Page
const MapPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-xl shadow-lg flex flex-col items-center gap-4 max-w-md w-full text-center">
        <div className="p-4 bg-blue-50 rounded-full">
          <Map className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Hello World</h1>
        <p className="text-gray-500">
          You are currently at <strong>{window.location.pathname}</strong>
        </p>
        <p className="text-gray-400 text-sm">
          Map integration coming soon.
        </p>
      </div>
    </div>
  );
};

// 2. Site Engineer Page
const SiteEngineerPage = () => {
  const [sliderValue, setSliderValue] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleSliderChange = (e) => {
    setSliderValue(parseInt(e.target.value));
  };

  const adjustValue = (delta) => {
    setSliderValue(prev => Math.max(0, Math.min(100, prev + delta)));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Please select an image under 5MB.");
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setSelectedImage(base64);
      } catch (err) {
        console.error("Error reading file:", err);
        setStatus("Error reading image file");
      }
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);
    setStatus('Preparing upload...');

    const payload = {
      source: 'site_engineer',
      timestamp: new Date().toISOString(),
      sliderValue: sliderValue,
      imageBase64: selectedImage, 
      metadata: {
        user: 'Site Engineer',
        location: 'Field Site A',
        hasImage: !!selectedImage
      }
    };

    try {
      setStatus('Uploading chunks...');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-indigo-900 mb-8 flex items-center gap-3">
          <Upload className="w-8 h-8" />
          Site Engineer
        </h1>

        <div className="space-y-8">
          {/* Slider Section */}
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
              className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 transition"
            >
              -10%
            </button>
            <button
              onClick={() => adjustValue(10)}
              disabled={uploading}
              className="flex-1 py-3 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 disabled:opacity-50 transition"
            >
              +10%
            </button>
          </div>

          {/* Image Upload Section */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Site Photo (Optional)
            </label>
            
            {!selectedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition group"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-indigo-500" />
                <p className="text-gray-500 font-medium group-hover:text-indigo-600">Click to upload site photo</p>
                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG (Max 5MB)</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                />
                <button 
                  onClick={clearImage}
                  disabled={uploading}
                  className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm hover:bg-red-50 text-gray-600 hover:text-red-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="p-2 bg-white border-t text-xs text-gray-500 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Image ready for upload
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.99]"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Uploading Data...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Submit Report
              </>
            )}
          </button>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Uploading chunks...</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${
              status.includes('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
            }`}>
              {status.includes('Error') ? (
                <AlertCircle className="w-5 h-5 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 shrink-0" />
              )}
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. Office Admin Page
const OfficeAdminPage = () => {
  const [data, setData] = useState({ sliderValue: 0, timestamp: null, imageUrl: null });
  const [lastUpdate, setLastUpdate] = useState('Never');
  const [loading, setLoading] = useState(false);

  const fetchLatestValue = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/latest-value`);
      if (response.ok) {
        const result = await response.json();
        if (result.timestamp) {
          setData(result);
          setLastUpdate(new Date(result.timestamp).toLocaleString());
        }
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-emerald-900 mb-8 flex items-center gap-3">
          <CheckCircle className="w-8 h-8" />
          Office Admin
        </h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Value Card */}
            <div className="bg-emerald-50 p-6 rounded-xl border-2 border-emerald-100 flex flex-col items-center justify-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 mb-2">
                Field Value
              </h2>
              <div className="text-6xl font-black text-emerald-600">
                {data.sliderValue}%
              </div>
            </div>

            {/* Image Card */}
            <div className="bg-gray-50 p-1 rounded-xl border-2 border-gray-100 h-48 md:h-auto flex items-center justify-center overflow-hidden relative group">
              {data.imageUrl ? (
                <img 
                  src={data.imageUrl} 
                  alt="Site Update" 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <span className="text-sm">No image received</span>
                </div>
              )}
              {data.imageUrl && (
                <a 
                  href={data.imageUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 text-white font-medium"
                >
                  View Full Size
                </a>
              )}
            </div>
          </div>

          {/* Visual Slider (Read Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visual Representation
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={data.sliderValue}
              disabled
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed accent-emerald-600"
            />
          </div>

          {/* Meta Data */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 flex justify-between items-center">
            <div>
              <p><strong>Last Updated:</strong> {lastUpdate}</p>
              <p className="mt-1">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${loading ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                {loading ? 'Syncing...' : 'Live Connection'}
              </p>
            </div>
            {data.source && (
               <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                 {data.source}
               </span>
            )}
          </div>

          <button
            onClick={fetchLatestValue}
            disabled={loading}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT WITH CUSTOM ROUTING ---

export default function App() {
  // Initialize state with current window pathname
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Handler for back/forward buttons
    const onPopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Custom navigation function to update URL without reload
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Determine active page based on path
  const getPage = () => {
    // Handle root path or empty string
    if (currentPath === '/' || currentPath === '') return 'engineer';
    // Strict matching for requested paths
    if (currentPath === '/map') return 'map';
    if (currentPath === '/admin') return 'admin';
    // Fallback to engineer if path unknown, or handle 404
    return 'engineer'; 
  };

  const activePage = getPage();

  return (
    <div>
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-center gap-2 md:gap-4 overflow-x-auto">
          <button
            onClick={() => navigate('/')}
            className={`px-4 md:px-6 py-2 rounded-lg font-medium transition text-sm md:text-base whitespace-nowrap ${
              activePage === 'engineer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Site Engineer
          </button>
          <button
            onClick={() => navigate('/admin')}
            className={`px-4 md:px-6 py-2 rounded-lg font-medium transition text-sm md:text-base whitespace-nowrap ${
              activePage === 'admin' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Office Admin
          </button>
          <button
            onClick={() => navigate('/map')}
            className={`px-4 md:px-6 py-2 rounded-lg font-medium transition text-sm md:text-base whitespace-nowrap flex items-center gap-2 ${
              activePage === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>

      {activePage === 'engineer' && <SiteEngineerPage />}
      {activePage === 'admin' && <OfficeAdminPage />}
      {activePage === 'map' && <MapPage />}
    </div>
  );
}