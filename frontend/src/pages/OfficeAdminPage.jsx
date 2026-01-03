import React, { useEffect, useState } from 'react';
import { CheckCircle, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { API_URL } from '../api/config';

export default function OfficeAdminPage() {
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
            <div className="bg-emerald-50 p-6 rounded-xl border-2 border-emerald-100 flex flex-col items-center justify-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 mb-2">Field Value</h2>
              <div className="text-6xl font-black text-emerald-600">{data.sliderValue}%</div>
            </div>

            <div className="bg-gray-50 p-1 rounded-xl border-2 border-gray-100 h-48 md:h-auto flex items-center justify-center overflow-hidden relative group">
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
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visual Representation</label>
            <input type="range" min="0" max="100" value={data.sliderValue} disabled className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed accent-emerald-600" />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 flex justify-between items-center">
            <div>
              <p><strong>Last Updated:</strong> {lastUpdate}</p>
              <p className="mt-1"><span className={`inline-block w-2 h-2 rounded-full mr-2 ${loading ? 'bg-yellow-400' : 'bg-green-500'}`}></span>{loading ? 'Syncing...' : 'Live Connection'}</p>
            </div>
            {data.source && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">{data.source}</span>}
          </div>

          <button onClick={fetchLatestValue} disabled={loading} className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
