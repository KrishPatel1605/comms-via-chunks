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
        zoomControl: false // We'll add it manually or just hide it to prevent UI clash
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

  // Manage Drawing Mode & Events (Mouse AND Touch)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const container = map.getContainer();
    const L = window.L;

    // Helper to finish and save the shape
    const finishShape = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      // Close the shape if it has enough points
      if (currentPathRef.current.length > 2) {
        const closedShape = [...currentPathRef.current]; 
        setPolygons(prev => [...prev, closedShape]);
      }

      // Reset temp line
      currentPathRef.current = [];
      tempPolylineRef.current.setLatLngs([]);
    };

    if (drawingMode) {
      // 1. Disable map dragging (panning) so we can draw
      map.dragging.disable();
      
      // 2. CSS critical for mobile: disable browser touch actions (scrolling/swiping)
      container.style.cursor = 'crosshair';
      container.style.touchAction = 'none';

      // --- MOUSE HANDLERS ---
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

      // --- TOUCH HANDLERS (Mobile) ---
      // Leaflet events don't always fire correctly for "drawing" on mobile, 
      // so we attach native listeners to the container for better control.
      
      const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return; // Only single finger drawing
        
        isDrawingRef.current = true;
        const touch = e.touches[0];
        
        // Convert screen pixel to map latlng
        const point = map.mouseEventToContainerPoint({ clientX: touch.clientX, clientY: touch.clientY });
        const latlng = map.containerPointToLatLng(point);
        
        currentPathRef.current = [latlng];
        tempPolylineRef.current.setLatLngs(currentPathRef.current);
      };

      const handleTouchMove = (e) => {
        if (!isDrawingRef.current) return;
        e.preventDefault(); // CRITICAL: Prevents scrolling the page while drawing
        
        const touch = e.touches[0];
        const point = map.mouseEventToContainerPoint({ clientX: touch.clientX, clientY: touch.clientY });
        const latlng = map.containerPointToLatLng(point);
        
        currentPathRef.current.push(latlng);
        tempPolylineRef.current.setLatLngs(currentPathRef.current);
      };

      // Attach MOUSE listeners via Leaflet
      map.on('mousedown', handleMouseDown);
      map.on('mousemove', handleMouseMove);
      map.on('mouseup', finishShape);
      
      // Attach TOUCH listeners via Native DOM
      // 'passive: false' is required to use preventDefault() in touchmove
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', finishShape);
      
      // Also handle mouse leaving the map area
      container.addEventListener('mouseleave', finishShape);

      return () => {
        // Cleanup
        map.dragging.enable();
        container.style.cursor = '';
        container.style.touchAction = ''; // Re-enable scrolling

        map.off('mousedown', handleMouseDown);
        map.off('mousemove', handleMouseMove);
        map.off('mouseup', finishShape);
        
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', finishShape);
        container.removeEventListener('mouseleave', finishShape);
      };
    } else {
      // Ensure dragging is enabled if we switch modes externally
      map.dragging.enable();
      container.style.cursor = '';
      container.style.touchAction = '';
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
        weight: 3,            // Thicker border
        smoothFactor: 1,      
        dashArray: '12, 12',  
        className: 'animated-border' 
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
      
      <style>{`
        @keyframes dash-rotate {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 240; }
        }
        
        path.animated-border {
          animation: dash-rotate 4s linear infinite;
          stroke-linecap: round;
        }

        /* Prevent text selection while drawing */
        .leaflet-container {
            -webkit-user-select: none;
            user-select: none;
        }
      `}</style>

      {/* Header / Top Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[5000] bg-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 sm:gap-4 transition-all duration-300 border border-gray-100 w-[90%] sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`p-2 rounded-full flex-shrink-0 ${drawingMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
            {drawingMode ? <Pencil size={20} /> : <MapIcon size={20} />}
          </div>
          <div className="flex flex-col min-w-[80px]">
            <span className="font-bold text-gray-800 text-sm truncate">
              {drawingMode ? 'Draw' : 'View'}
            </span>
            <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">
              {drawingMode 
                ? 'Drag finger/mouse' 
                : 'Pan and zoom'}
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-gray-200 mx-1 sm:mx-2 flex-shrink-0"></div>

        {!drawingMode ? (
          <button 
            onClick={() => setDrawingMode(true)}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <Pencil size={16} />
            <span className="hidden sm:inline">Start Drawing</span>
            <span className="sm:hidden">Draw</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
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
              className="flex-shrink-0 flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ml-1"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Clear Button */}
      {polygons.length > 0 && !drawingMode && (
        <button
          onClick={handleClearAll}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 z-[1000] bg-white text-red-600 px-4 py-3 rounded-full shadow-lg hover:bg-red-50 transition-all flex items-center gap-2 text-sm font-bold border border-gray-200"
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