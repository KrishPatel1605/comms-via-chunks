import React, { useEffect, useState } from 'react';
import { CheckCircle, Image as ImageIcon, RefreshCw, Plus, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

import { API_URL } from './api/config';

export default function OfficeAdminPage() {
  const [data, setData] = useState({ sliderValue: 0, timestamp: null, imageUrl: null });
  const [lastUpdate, setLastUpdate] = useState('Never');
  const [loading, setLoading] = useState(false);
  
  // Task State
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);

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

  useEffect(() => {
    fetchLatestValue();
    fetchTasks();
    const interval = setInterval(() => {
      fetchLatestValue();
      fetchTasks();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate live progress from tasks
  const calculateLiveProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const liveProgress = calculateLiveProgress();

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
              {data.imageUrl && (
                <a href={data.imageUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 text-white font-medium">View Full Size</a>
              )}
               <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                Last Photo: {lastUpdate}
              </div>
            </div>
          </div>
          
           <button onClick={fetchLatestValue} disabled={loading} className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Site Data
          </button>
        </div>

        {/* Task Management Section */}
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
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
            <button 
              type="submit" 
              disabled={taskLoading || !newTask.trim()}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </form>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No tasks active. Add one above!
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-teal-200 transition gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-800 font-medium">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === 'pending' && (
                      <button 
                        onClick={() => updateTaskStatus(task._id, 'in-progress')}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
                      >
                        <PlayCircle className="w-4 h-4" /> Start
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button 
                        onClick={() => updateTaskStatus(task._id, 'completed')}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </button>
                    )}
                    {task.status === 'completed' && (
                       <button 
                       onClick={() => updateTaskStatus(task._id, 'pending')}
                       className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                     >
                       Reopen
                     </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}