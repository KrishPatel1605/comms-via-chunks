import React, { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, 
  X, 
  RotateCcw, 
  Trash2, 
  Pencil, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Eye, 
  Calendar,
  Check,
  Edit2,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Timer
} from 'lucide-react';

// --- Helper to get Tile URL for Preview ---
const getTileUrl = (lat, lng, zoom) => {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
};

// --- Point-in-polygon (ray-casting) ---
const isPointInPolygon = (point, vs) => {
  if (!vs || vs.length < 3) return false;
  const x = point.lng;
  const y = point.lat;

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].lng, yi = vs[i].lat;
    const xj = vs[j].lng, yj = vs[j].lat;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

// --- Mini Preview Component with Map Background ---
const PolygonPreview = ({ points }) => {
  if (!points || points.length < 2) return null;

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const tileUrl = getTileUrl(centerLat, centerLng, 15);

  const latSpan = maxLat - minLat || 0.0001;
  const lngSpan = maxLng - minLng || 0.0001;

  const svgPoints = points.map(p => {
    const x = ((p.lng - minLng) / lngSpan) * 100;
    const y = 100 - ((p.lat - minLat) / latSpan) * 100; 
    return `${x},${y}`;
  }).join(' ');

  return (
    <div 
      className="w-16 h-16 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative bg-gray-100"
      style={{
        backgroundImage: `url(${tileUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-white/30" />
      <svg viewBox="-10 -10 120 120" className="w-full h-full overflow-visible relative z-10">
        <polygon 
          points={svgPoints} 
          fill="#3b82f6" 
          fillOpacity="0.6" 
          stroke="#2563eb" 
          strokeWidth="3" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default function MapPage() {
  const [isMapReady, setIsMapReady] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [polygons, setPolygons] = useState([]); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Interaction & Editing
  const [hoveredPolyId, setHoveredPolyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");
  
  // Expansion State for Sidebar Accordion
  const [expandedZoneIds, setExpandedZoneIds] = useState(new Set());

  // Location & Zone Logic
  const [userLocation, setUserLocation] = useState(null); 
  const [insideZoneId, setInsideZoneId] = useState(null); 

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayersRef = useRef({}); 
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const tempPolylineRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Load Leaflet
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
      const map = L.map(mapRef.current, {
        zoomControl: false 
      }).setView([19.0760, 72.8777], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      mapInstanceRef.current = map;
      
      tempPolylineRef.current = L.polyline([], {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8
      }).addTo(map);
    }
  }, [isMapReady]);

  // Sidebar Resize Handler
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  }, [isSidebarOpen]);

  // Sync Map Highlight
  useEffect(() => {
    const L = window.L;
    if (!L) return;

    Object.entries(polygonLayersRef.current).forEach(([id, layer]) => {
      const isHovered = parseInt(id) === hoveredPolyId;
      
      if (isHovered) {
        layer.setStyle({
          color: '#2563eb', 
          fillColor: '#3b82f6',
          fillOpacity: 0.6,
          weight: 4,
          dashArray: null 
        });
        layer.openPopup();
      } else {
        layer.setStyle({
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.35,
          weight: 3,
          dashArray: '12, 12',
        });
        layer.closePopup();
      }
    });
  }, [hoveredPolyId, insideZoneId]);

  // Drawing Logic (Mouse & Touch)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const container = map.getContainer();

    const finishShape = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      if (currentPathRef.current.length > 2) {
        const closedShape = [...currentPathRef.current];
        const newPoly = {
          id: Date.now(),
          name: `Zone ${polygons.length + 1}`,
          points: closedShape,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setPolygons(prev => [...prev, newPoly]);
        setIsSidebarOpen(true);
      }

      currentPathRef.current = [];
      tempPolylineRef.current.setLatLngs([]);
    };

    if (drawingMode) {
      map.dragging.disable();
      container.style.cursor = 'crosshair';
      
      // --- MOUSE HANDLERS ---
      const handleMouseDown = (e) => {
        isDrawingRef.current = true;
        currentPathRef.current = [e.latlng]; 
        tempPolylineRef.current.setLatLngs(currentPathRef.current);
      };
      const handleMouseMove = (e) => {
        if (!isDrawingRef.current) return;
        currentPathRef.current.push(e.latlng);
        tempPolylineRef.current.setLatLngs(currentPathRef.current);
      };

      // --- TOUCH HANDLERS (for Mobile) ---
      // We attach these to the container to strictly control behavior (preventDefault)
      const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return; // Only allow single finger drawing
        // Important: Prevent default to stop map scrolling/refreshing
        e.preventDefault(); 
        isDrawingRef.current = true;

        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        // Calculate LatLng relative to container
        const point = [touch.clientX - rect.left, touch.clientY - rect.top];
        const latlng = map.containerPointToLatLng(point);

        currentPathRef.current = [latlng];
        tempPolylineRef.current.setLatLngs(currentPathRef.current);
      };

      const handleTouchMove = (e) => {
        if (!isDrawingRef.current) return;
        e.preventDefault(); // Stop scrolling while dragging

        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const point = [touch.clientX - rect.left, touch.clientY - rect.top];
        const latlng = map.containerPointToLatLng(point);

        currentPathRef.current.push(latlng);
        tempPolylineRef.current.setLatLngs(currentPathRef.current);
      };

      const handleTouchEnd = (e) => {
        finishShape();
      };

      // Add Mouse Listeners (Leaflet API)
      map.on('mousedown', handleMouseDown);
      map.on('mousemove', handleMouseMove);
      map.on('mouseup', finishShape);

      // Add Touch Listeners (Native DOM API for control)
      // Passive: false is required to use preventDefault
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('touchcancel', handleTouchEnd);

      return () => {
        map.dragging.enable();
        container.style.cursor = '';
        
        // Clean up Mouse
        map.off('mousedown', handleMouseDown);
        map.off('mousemove', handleMouseMove);
        map.off('mouseup', finishShape);
        
        // Clean up Touch
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchEnd);
      };
    } else {
      map.dragging.enable();
      container.style.cursor = '';
    }
  }, [drawingMode, isMapReady, polygons.length]);

  // Render Polygons
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const L = window.L;

    Object.values(polygonLayersRef.current).forEach(layer => map.removeLayer(layer));
    polygonLayersRef.current = {};

    polygons.forEach(poly => {
      const polygon = L.polygon(poly.points, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.35,
        weight: 3,
        dashArray: '12, 12',
        className: 'animated-border' 
      }).addTo(map);
      
      polygon.bindPopup(`<b>${poly.name}</b><br>Created: ${poly.date}`);
      polygon.on('mouseover', () => { if (!editingId) setHoveredPolyId(poly.id); });
      polygon.on('mouseout', () => { if (!editingId) setHoveredPolyId(null); });
      
      polygonLayersRef.current[poly.id] = polygon;
    });

    if (userLocation) evaluateUserInsideZone(userLocation, polygons);
  }, [polygons, editingId]); 

  // --- Logic ---

  const handleClearAll = () => {
    setPolygons([]);
    setInsideZoneId(null);
    setExpandedZoneIds(new Set());
  };

  const deletePolygon = (id, e) => {
    e.stopPropagation();
    setPolygons(prev => prev.filter(p => p.id !== id));
    if(hoveredPolyId === id) setHoveredPolyId(null);
    if (insideZoneId === id) setInsideZoneId(null);
  };

  const focusOnPolygon = (id) => {
    const layer = polygonLayersRef.current[id];
    if (layer && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(layer.getBounds(), { padding: [50, 50] });
    }
  };

  const toggleZoneExpansion = (e, id) => {
    e.stopPropagation();
    setExpandedZoneIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const startEditing = (poly, e) => {
    e.stopPropagation();
    setEditingId(poly.id);
    setTempName(poly.name);
  };
  const saveName = (id) => {
    setPolygons(prev => prev.map(p => p.id === id ? { ...p, name: tempName } : p));
    setEditingId(null);
  };

  // --- Geolocation ---

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn(err),
      { enableHighAccuracy: true }
    );
  }, []);

  const evaluateUserInsideZone = (loc, polygonsList = polygons) => {
    if (!loc) {
      setInsideZoneId(null);
      return;
    }
    for (let poly of polygonsList) {
      if (isPointInPolygon(loc, poly.points)) {
        setInsideZoneId(poly.id);
        // Auto-expand the zone if user is inside it for better visibility
        setExpandedZoneIds(prev => new Set(prev).add(poly.id));
        return;
      }
    }
    setInsideZoneId(null);
  };

  useEffect(() => {
    if (!userLocation) return;
    evaluateUserInsideZone(userLocation, polygons);
  }, [userLocation]);

  // --- MARKER LOGIC ---
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (!userLocation || !insideZoneId) return;

    // Custom Simple Marker (Pulsing Dot)
    const simpleIcon = L.divIcon({
      className: 'custom-marker-container', // defined in styles below
      html: `
        <div class="relative flex h-4 w-4">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white shadow-sm"></span>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -10]
    });

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: simpleIcon,
      title: 'Site Engineer'
    }).addTo(map);

    marker.bindPopup(`<div class="text-xs font-bold text-gray-600">Site Engineer</div>`);
    userMarkerRef.current = marker;
    
    // Optional: Auto-pan to user if inside zone
    const layer = polygonLayersRef.current[insideZoneId];
    if (layer) {
       map.fitBounds(layer.getBounds(), { padding: [80, 80], maxZoom: 16 });
    }

    return () => {
      if (userMarkerRef.current) {
        try { map.removeLayer(userMarkerRef.current); } catch(e) {}
        userMarkerRef.current = null;
      }
    };
  }, [userLocation, insideZoneId, isMapReady]);

  // --- Calculate Entry Time (-30 mins) ---
  const getEntryTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 30);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const refreshUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => alert('Unable to retrieve location'),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <style>{`
        @keyframes dash-rotate {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 240; }
        }
        path.animated-border {
          animation: dash-rotate 4s linear infinite;
          stroke-linecap: round;
        }
        .leaflet-container {
            -webkit-user-select: none;
            user-select: none;
        }
        /* Fix for divIcon centering */
        .leaflet-div-icon {
          background: transparent;
          border: none;
        }
      `}</style>

      {/*--- SIDEBAR ---*/}
      <div 
        className={`bg-white shadow-xl z-[4000] flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200 
          ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
        `}
      >
        <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Saved Areas</h2>
            <p className="text-xs text-gray-400 font-medium">{polygons.length} areas defined</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {polygons.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
              <MapIcon size={48} className="mb-3 opacity-20" />
              <p className="text-sm">No areas drawn yet.</p>
              <p className="text-xs mt-1">Enable "Draw" mode to add new zones.</p>
            </div>
          ) : (
            polygons.map((poly) => {
              const isExpanded = expandedZoneIds.has(poly.id);
              const isEngineerInside = insideZoneId === poly.id;

              return (
                <div 
                  key={poly.id}
                  className={`flex flex-col rounded-xl border transition-all ${
                    editingId === poly.id 
                      ? 'bg-blue-50 border-blue-300 shadow-md' 
                      : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'
                  }`}
                >
                  {/* Card Header (Click to focus map, click chevron to expand) */}
                  <div 
                    onClick={() => focusOnPolygon(poly.id)}
                    className="flex gap-3 p-3 cursor-pointer group"
                  >
                    <PolygonPreview points={poly.points} />

                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      {editingId === poly.id ? (
                        <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full text-sm font-semibold text-gray-800 bg-white border border-blue-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveName(poly.id);
                            }}
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); saveName(poly.id); }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate text-gray-700">
                              {poly.name}
                            </h3>
                            {isEngineerInside && (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center">
                            <button
                              onClick={(e) => startEditing(poly, e)}
                              className="p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Edit2 size={12} />
                            </button>
                            {!editingId && (
                               <button 
                                onClick={(e) => deletePolygon(poly.id, e)}
                                className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                            <button
                              onClick={(e) => toggleZoneExpansion(e, poly.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded ml-1"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Calendar size={10} />
                        <span>Created: {poly.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content (Accordion) */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 bg-gray-50/50 p-3 text-sm animate-in slide-in-from-top-1 duration-200">
                      {isEngineerInside ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">
                            <div className="bg-green-100 p-1.5 rounded-full">
                               <User size={16} className="text-green-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-xs uppercase tracking-wide">Status</p>
                                <p className="font-medium">1 On-site Engineer</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-gray-600 pl-1">
                             <Clock size={16} className="text-gray-400" />
                             <div>
                                <p className="text-xs text-gray-400">Time Entered</p>
                                <p className="font-mono text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700 inline-block mt-0.5">
                                    {getEntryTime()}
                                </p>
                             </div>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600 pl-1">
                             <Timer size={16} className="text-gray-400" />
                             <div>
                                <p className="text-xs text-gray-400">Work Duration</p>
                                <p className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded inline-block mt-0.5">
                                    30 min
                                </p>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2 text-gray-400 gap-1">
                           <p className="text-xs italic">No active personnel in this zone.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
           <button 
             onClick={handleClearAll}
             disabled={polygons.length === 0}
             className="w-full py-2 px-4 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             <Trash2 size={16} />
             Delete All Areas
           </button>
        </div>
      </div>

      {/* --- MAIN CONTENT (Map) --- */}
      <div className="flex-1 relative flex flex-col min-w-0">
        
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-24 left-4 z-[1000] bg-white p-2 rounded-lg shadow-md border border-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        {/* Top Control Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[3000] bg-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 sm:gap-4 transition-all duration-300 border border-gray-100 w-[90%] sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`p-2 rounded-full flex-shrink-0 ${drawingMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
              {drawingMode ? <Pencil size={20} /> : <MapIcon size={20} />}
            </div>
            <div className="flex flex-col min-w-[80px]">
              <span className="font-bold text-gray-800 text-sm truncate">
                {drawingMode ? 'Draw Mode' : 'View Mode'}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">
                {drawingMode ? 'Sketch areas freely' : 'Explore the map'}
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-gray-200 mx-1 sm:mx-2 flex-shrink-0"></div>

          {!drawingMode ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDrawingMode(true)}
                className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
              >
                <Pencil size={16} />
                <span className="hidden sm:inline">Start Drawing</span>
                <span className="sm:hidden">Draw</span>
              </button>
              <button
                onClick={() => {
                   if (userLocation && mapInstanceRef.current) {
                     mapInstanceRef.current.panTo([userLocation.lat, userLocation.lng]);
                   } else {
                     refreshUserLocation();
                   }
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                title="Center on my location"
              >
                <Eye size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
               <button 
                onClick={() => setPolygons(prev => prev.slice(0, -1))}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
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

        <div ref={mapRef} id="map" className="w-full h-full z-0 outline-none bg-gray-200" />
        
        {!isMapReady && (
          <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center z-[2000]">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading Map...</p>
          </div>
        )}
      </div>
    </div>
  );
}