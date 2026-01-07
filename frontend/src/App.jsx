// import React, { useEffect, useState } from 'react';
// import Header from './components/Header';
// import SiteEngineerPage from './pages/SiteEngineerPage';
// import OfficeAdminPage from './pages/OfficeAdminPage';
// import MapPage from './pages/MapPage';

// export default function App() {
//   const [currentPath, setCurrentPath] = useState(window.location.pathname);

//   useEffect(() => {
//     const onPopState = () => setCurrentPath(window.location.pathname);
//     window.addEventListener('popstate', onPopState);
//     return () => window.removeEventListener('popstate', onPopState);
//   }, []);

//   const navigate = (path) => {
//     window.history.pushState({}, '', path);
//     setCurrentPath(path);
//   };

//   const getPage = () => {
//     if (currentPath === '/' || currentPath === '') return 'engineer';
//     if (currentPath === '/map') return 'map';
//     if (currentPath === '/admin') return 'admin';
//     return 'engineer';
//   };

//   const activePage = getPage();

//   return (
//     <div>
//       <Header activePage={activePage} navigate={navigate} />

//       {activePage === 'engineer' && <SiteEngineerPage />}
//       {activePage === 'admin' && <OfficeAdminPage />}
//       {activePage === 'map' && <MapPage />}
//     </div>
//   );
// }


import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './Pages/Home'
import Project from './Pages/Project'
import MapPage from './Pages/MapPage'
import SiteEngineerPage from './Pages/SiteEngineerPage'
import OfficeAdminPage from './Pages/OfficeAdminPage'


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/project" element={<Project />} />
      <Route path="/siteengg" element={<SiteEngineerPage />} />
      <Route path="/admin" element={<OfficeAdminPage />} />
      <Route path="/map" element={<MapPage />} />
    </Routes>
  )
}

export default App
