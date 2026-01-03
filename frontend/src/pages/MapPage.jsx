import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Plus, X, RotateCcw, Trash2, MousePointer2, Pencil } from 'lucide-react';

export default function MapPage() {
  const [isMapReady, setIsMapReady] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [polygons, setPolygons] = useState([]); // Array of arrays of coordinates
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayersRef = useRef([]);
  
  // Freehand drawing refs (to avoid re-renders during draw)
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const tempPolylineRef = useRef(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (document.getElementById('leaflet-css')) {
      setIsMapReady(true);
      return;
    }

    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setIsMapReady(true);
    document.body.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (isMapReady && !mapInstanceRef.current && mapRef.current) {
      const L = window.L;
      // Initialize map
      const map = L.map(mapRef.current, {
        zoomControl: false // We'll add it manually or just hide it to prevent UI clash if needed, but let's just z-index the header higher
      }).setView([19.0760, 72.8777], 13);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      mapInstanceRef.current = map;
      
      // Create a temporary polyline for drawing
      tempPolylineRef.current = L.polyline([], {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8
      }).addTo(map);
    }
  }, [isMapReady]);

  // Manage Drawing Mode & Events
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const L = window.L;

    if (drawingMode) {
      // Disable map dragging (panning) so we can draw
      map.dragging.disable();
      map.getContainer().style.cursor = 'crosshair';

      const handleMouseDown = (e) => {
        isDrawingRef.current = true;
        currentPathRef.current = [e.latlng]; // Start new path
        tempPolylineRef.current.setLatLngs(currentPathRef.current);
      };

      const handleMouseMove = (e) => {
        if (!isDrawingRef.current) return;
        currentPathRef.current.push(e.latlng);
        tempPolylineRef.current.setLatLngs(currentPathRef.current);
      };

      const handleMouseUp = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        // Close the shape if it has enough points
        if (currentPathRef.current.length > 2) {
          // Add to state (this triggers the polygon renderer effect)
          const closedShape = [...currentPathRef.current]; 
          setPolygons(prev => [...prev, closedShape]);
        }

        // Reset temp line
        currentPathRef.current = [];
        tempPolylineRef.current.setLatLngs([]);
      };

      // Add listeners
      map.on('mousedown', handleMouseDown);
      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);
      
      // Also handle mouse leaving the map area to finish the shape
      map.getContainer().addEventListener('mouseleave', handleMouseUp);

      return () => {
        // Cleanup when exiting drawing mode
        map.dragging.enable();
        map.getContainer().style.cursor = '';
        map.off('mousedown', handleMouseDown);
        map.off('mousemove', handleMouseMove);
        map.off('mouseup', handleMouseUp);
        map.getContainer().removeEventListener('mouseleave', handleMouseUp);
      };
    } else {
      map.dragging.enable();
      map.getContainer().style.cursor = '';
    }
  }, [drawingMode, isMapReady]);

  // Render Completed Polygons
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const L = window.L;

    // Clear old polygon layers
    polygonLayersRef.current.forEach(layer => map.removeLayer(layer));
    polygonLayersRef.current = [];

    polygons.forEach(polyPoints => {
      const polygon = L.polygon(polyPoints, {
        color: '#ef4444',     // Red border
        fillColor: '#ef4444', // Red fill
        fillOpacity: 0.35,
        weight: 2,
        smoothFactor: 1 // Optimize the freehand line
      }).addTo(map);
      
      polygon.bindPopup("Highlighted Area");
      polygonLayersRef.current.push(polygon);
    });
  }, [polygons]);

  const handleUndoLast = () => {
    setPolygons(prev => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setPolygons([]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative overflow-hidden font-sans">
      
      {/* Header / Top Bar - Increased Z-Index to 5000 to stay above everything */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[5000] bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 transition-all duration-300 border border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${drawingMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
            {drawingMode ? <Pencil size={20} /> : <MapIcon size={20} />}
          </div>
          <div className="flex flex-col min-w-[100px]">
            <span className="font-bold text-gray-800 text-sm">
              {drawingMode ? 'Freehand Mode' : 'View Mode'}
            </span>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {drawingMode 
                ? 'Click & drag to draw' 
                : 'Pan and zoom'}
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

        {!drawingMode ? (
          <button 
            onClick={() => setDrawingMode(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <Pencil size={16} />
            Start Drawing
          </button>
        ) : (
          <div className="flex items-center gap-2">
             <button 
              onClick={handleUndoLast}
              disabled={polygons.length === 0}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo last shape"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={() => setDrawingMode(false)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ml-2"
            >
              <X size={16} />
              Exit Drawing
            </button>
          </div>
        )}
      </div>

      {/* Floating Clear Button */}
      {polygons.length > 0 && !drawingMode && (
        <button
          onClick={handleClearAll}
          className="absolute bottom-8 left-8 z-[1000] bg-white text-red-600 px-4 py-3 rounded-full shadow-lg hover:bg-red-50 transition-all flex items-center gap-2 text-sm font-bold border border-gray-200"
        >
          <Trash2 size={18} />
          Clear Map
        </button>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        id="map" 
        className="w-full h-full z-0 outline-none"
      />

      {/* Loading State */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center z-[2000]">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading Map Engine...</p>
        </div>
      )}
    </div>
  );
}