import React from 'react';
import { Map } from 'lucide-react';

export default function Header({ activePage, navigate }) {
  return (
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
  );
}