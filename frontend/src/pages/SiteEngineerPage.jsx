import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Upload, RefreshCw, Image as ImageIcon, X, PlayCircle, CheckCircle2, Clock, Camera, FormIcon } from 'lucide-react';
import Header from '../Components/Header'

// --- INLINED CONSTANTS & UTILS ---
const API_URL = 'http://localhost:3001';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const uploadChunkedData = async (payload, onProgress, apiUrl) => {
  const jsonString = JSON.stringify(payload);
  const chunkSize = 1024 * 50; // 50KB chunks
  const totalChunks = Math.ceil(jsonString.length / chunkSize);
  // Use a random UUID for the upload session
  const uploadId = crypto.randomUUID();

  for (let i = 0; i < totalChunks; i++) {
    const chunk = jsonString.slice(i * chunkSize, (i + 1) * chunkSize);

    const response = await fetch(`${apiUrl}/upload-chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        chunkIndex: i,
        totalChunks,
        payload: chunk
      })
    });

    if (!response.ok) {
      throw new Error(`Upload failed at chunk ${i + 1}`);
    }

    onProgress(((i + 1) / totalChunks) * 100);
  }
  return uploadId;
};
// ---------------------------------

export default function SiteEngineerPage() {
  // Task State
  const [tasks, setTasks] = useState([]);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch tasks on load
  useEffect(() => {
    fetchTasks();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (response.ok) {
        setTasks(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Calculate progress based on completed tasks
  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const currentProgress = calculateProgress();

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
      sliderValue: currentProgress, // Send the calculated progress
      imageBase64: selectedImage,
      metadata: {
        user: 'Site Engineer',
        location: 'Field Site A',
        hasImage: !!selectedImage,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br p-4 md:p-8">
      <Header />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[100%] h-[730px] bg-[#4361ee] rounded-b-4xl"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto rounded-xl mt-15  p-6 md:p-8">
        <h1 className="text-4xl staatliches_ns text-white gap-3 mt-5 flex items-center">
          <FormIcon className='w-8 h-8'/>
          DPR Form
        </h1>

        <div className="space-y-8 mt-5">

          {/* Progress Section */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-bold text-[#4361ee] uppercase tracking-wider">Project Completion</label>
              <span className="text-3xl font-black text-[#4361ee]">{currentProgress}%</span>
            </div>
            <div className="w-full rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#4361ee] h-full transition-all duration-500 ease-out"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
            <p className="text-xs text-[#4361ee] mt-2 text-right">
              Based on {tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks
            </p>
          </div>

          {/* Task List */}
          <div>
            <h3 className="text-3xl font-semibold text-white mb-4 flex items-center gap-2 staatliches_ns">
              <Clock className="w-8 h-8 text-white" />
              Active Tasks
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No tasks assigned yet.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-gray-800 font-medium">{task.description}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTaskStatus(task._id, 'in-progress')}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition"
                        >
                          <PlayCircle className="w-4 h-4" /> Start Task
                        </button>
                      )}
                      {task.status === 'in-progress' && (
                        <button
                          onClick={() => updateTaskStatus(task._id, 'completed')}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark Complete
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <button
                          onClick={() => updateTaskStatus(task._id, 'in-progress')}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="pt-6">
            <label className="font-medium text-[#4361ee] staatliches_ns text-3xl flex items-center gap-2"><Camera className='w-8 h-8'/>Site Photo (Optional)</label>

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

          <button onClick={handleUpload} disabled={uploading} className="w-full px-6 py-4 bg-[#4361ee] text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.99]">
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