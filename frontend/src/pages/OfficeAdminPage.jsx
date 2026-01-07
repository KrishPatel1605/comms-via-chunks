import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  Image as ImageIcon, 
  RefreshCw, 
  Plus, 
  Clock, 
  PlayCircle, 
  CheckCircle2,
  Package,
  XCircle,
  History
} from 'lucide-react';

// Hardcoded API URL to prevent resolution errors in the preview environment
import { API_URL } from "../api/config";

export default function OfficeAdminPage() {
  const [data, setData] = useState({ sliderValue: 0, timestamp: null, imageUrl: null });
  const [lastUpdate, setLastUpdate] = useState('Never');
  const [loading, setLoading] = useState(false);
  
  // Task State
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);

  // Material State
  const [materialRequests, setMaterialRequests] = useState([]);
  const [matLoading, setMatLoading] = useState(false);

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

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (response.ok) setTasks(await response.json());
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_URL}/materials`);
      if (response.ok) setMaterialRequests(await response.json());
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTaskLoading(true);
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newTask })
      });
      if (response.ok) {
        setNewTask('');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setTaskLoading(false);
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

  // Material Logic (Backend Integrated)
  const handleMaterialAction = async (id, status) => {
    setMatLoading(true);
    try {
      const response = await fetch(`${API_URL}/materials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) fetchMaterials();
    } catch (error) {
      console.error('Error updating material status:', error);
    } finally {
      setMatLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestValue();
    fetchTasks();
    fetchMaterials();
    
    const interval = setInterval(() => {
      fetchLatestValue();
      fetchTasks();
      fetchMaterials();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const liveProgress = tasks.length ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header & Main Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-emerald-900 mb-8 flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            Office Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-emerald-50 p-6 rounded-xl border-2 border-emerald-100 flex flex-col items-center justify-center min-h-[200px]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 mb-2">Project Progress</h2>
              <div className="text-6xl font-black text-emerald-600">{liveProgress}%</div>
              <div className="mt-4 text-xs text-emerald-600 font-medium bg-emerald-100 px-3 py-1 rounded-full">
                {tasks.filter(t => t.status === 'completed').length} / {tasks.length} Tasks Completed
              </div>
            </div>

            <div className="bg-gray-50 p-1 rounded-xl border-2 border-gray-100 min-h-[200px] flex items-center justify-center overflow-hidden relative group">
              {data.imageUrl ? (
                <img src={data.imageUrl} alt="Site Update" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <span className="text-sm">No image received</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                Last Update: {lastUpdate}
              </div>
            </div>
          </div>
          
          <button onClick={fetchLatestValue} disabled={loading} className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Site Data
          </button>
        </div>

        {/* Material Approvals (Backend Integrated) */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            Material Approvals
          </h2>
          <div className="space-y-4">
            {materialRequests.filter(r => r.status === 'pending').length === 0 ? (
              <p className="text-center py-8 text-gray-400 border border-dashed rounded-lg">No pending material requests.</p>
            ) : (
              materialRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req._id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Package className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{req.name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {req.qty}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleMaterialAction(req._id, 'approved')} 
                      disabled={matLoading}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleMaterialAction(req._id, 'rejected')} 
                      disabled={matLoading}
                      className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {materialRequests.filter(r => r.status !== 'pending').length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> Recent History
              </h3>
              <div className="space-y-2">
                {materialRequests.filter(r => r.status !== 'pending').slice(0, 5).map(req => (
                  <div key={req._id} className="flex justify-between p-3 bg-gray-50 rounded-lg text-xs">
                    <span className="text-gray-700 font-medium">{req.name} ({req.qty})</span>
                    <span className={req.status === 'approved' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Task Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            Task Management
          </h2>
          <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
            <input 
              type="text" 
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter new task description..." 
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
            />
            <button type="submit" disabled={taskLoading || !newTask.trim()} className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Task
            </button>
          </form>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-gray-800 font-medium">{task.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {task.status !== 'completed' ? (
                    <button onClick={() => updateTaskStatus(task._id, 'completed')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition">
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </button>
                  ) : (
                    <button onClick={() => updateTaskStatus(task._id, 'pending')} className="text-xs text-gray-400 hover:text-gray-600">Reopen</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}