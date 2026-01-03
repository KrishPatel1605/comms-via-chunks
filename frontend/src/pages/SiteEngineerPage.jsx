import React, { useState, useRef } from 'react';
import { AlertCircle, CheckCircle, Upload, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import { fileToBase64, uploadChunkedData } from '../utils/chunker';
import { API_URL } from '../api/config';

export default function SiteEngineerPage() {
  const [sliderValue, setSliderValue] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleSliderChange = (e) => setSliderValue(parseInt(e.target.value));
  const adjustValue = (delta) => setSliderValue(prev => Math.max(0, Math.min(100, prev + delta)));

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Please select an image under 5MB.');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setSelectedImage(base64);
    } catch (err) {
      console.error('Error reading file:', err);
      setStatus('Error reading image file');
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
      sliderValue,
      imageBase64: selectedImage,
      metadata: {
        user: 'Site Engineer',
        location: 'Field Site A',
        hasImage: !!selectedImage
      }
    };

    try {
      setStatus('Uploading chunks...');
      await uploadChunkedData(payload, setProgress, API_URL);
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Value: {sliderValue}%</label>
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
            <button onClick={() => adjustValue(-10)} disabled={uploading} className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 transition">-10%</button>
            <button onClick={() => adjustValue(10)} disabled={uploading} className="flex-1 py-3 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 disabled:opacity-50 transition">+10%</button>
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Site Photo (Optional)</label>

            {!selectedImage ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition group">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-indigo-500" />
                <p className="text-gray-500 font-medium group-hover:text-indigo-600">Click to upload site photo</p>
                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG (Max 5MB)</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img src={selectedImage} alt="Preview" className="w-full h-48 object-cover" />
                <button onClick={clearImage} disabled={uploading} className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm hover:bg-red-50 text-gray-600 hover:text-red-600 transition">
                  <X className="w-5 h-5" />
                </button>
                <div className="p-2 bg-white border-t text-xs text-gray-500 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Image ready for upload
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
          </div>

          <button onClick={handleUpload} disabled={uploading} className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.99]">
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

          {uploading && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Uploading chunks...</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {status && (
            <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${status.includes('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
              {status.includes('Error') ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
