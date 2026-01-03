import React from 'react';
import { Map as MapIcon } from 'lucide-react';

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-xl shadow-lg flex flex-col items-center gap-4 max-w-md w-full text-center">
        <div className="p-4 bg-blue-50 rounded-full">
          <MapIcon className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Hello World</h1>
        <p className="text-gray-500">You are currently at <strong>{window.location.pathname}</strong></p>
        <p className="text-gray-400 text-sm">Map integration coming soon.</p>
      </div>
    </div>
  );
}
