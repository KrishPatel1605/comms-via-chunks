import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  RefreshCw, 
  Image as ImageIcon, 
  X, 
  PlayCircle, 
  CheckCircle2, 
  Clock,
  Plus,
  Package,
  ShoppingCart
} from 'lucide-react';

// Hardcoded API URL to prevent resolution errors in the preview environment
import { API_URL } from "../api/config";

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

export default function SiteEngineerPage({ materialRequests = [], addMaterialRequest }) {
  // Task State (Backend)
  const [tasks, setTasks] = useState([]);
  
  // Upload State (Backend)
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Material Form State (Local Only)
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('');

  // Fetch tasks on load
  useEffect(() => {
    fetchTasks();
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
      sliderValue: currentProgress,
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

  const handleMaterialSubmit = (e) => {
    e.preventDefault();
    if (!matName || !matQty) return;
    if (addMaterialRequest) {
      addMaterialRequest({
        id: Date.now(),
        name: matName,
        qty: matQty,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    }
    setMatName('');
    setMatQty('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-8 flex items-center gap-3">
            <Upload className="w-8 h-8" />
            Site Engineer
          </h1>

          <div className="space-y-8">
            {/* Progress Section */}
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Project Completion</label>
                <span className="text-3xl font-black text-indigo-600">{currentProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500 ease-out" 
                  style={{ width: `${currentProgress}%` }} 
                />
              </div>
            </div>

            {/* Task List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
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
                          <button onClick={() => updateTaskStatus(task._id, 'in-progress')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition">
                            <PlayCircle className="w-4 h-4" /> Start Task
                          </button>
                        )}
                        {task.status === 'in-progress' && (
                          <button onClick={() => updateTaskStatus(task._id, 'completed')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition">
                            <CheckCircle2 className="w-4 h-4" /> Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Material Request Section (Local Only) */}
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                Material Requisition
              </h3>
              <form onSubmit={handleMaterialSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <input 
                  type="text" 
                  placeholder="Material name..." 
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={matName}
                  onChange={e => setMatName(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Quantity..." 
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={matQty}
                  onChange={e => setMatQty(e.target.value)}
                />
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 transition flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Request
                </button>
              </form>

              <div className="space-y-2">
                {materialRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-sm">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span><span className="font-bold">{req.name}</span> • {req.qty}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      req.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                      req.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Site Photo (Optional)</label>
              {!selectedImage ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition group">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-indigo-500" />
                  <p className="text-gray-500 font-medium group-hover:text-indigo-600">Click to upload site photo</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={selectedImage} alt="Preview" className="w-full h-48 object-cover" />
                  <button onClick={clearImage} className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm text-gray-600 hover:text-red-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            </div>

            <button onClick={handleUpload} disabled={uploading} className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md">
              {uploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              Submit Site Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}