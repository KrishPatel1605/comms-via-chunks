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


import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Home from './Pages/Home'
import Project from './Pages/Project'
import MapPage from './Pages/MapPage'
import SiteEngineerPage from './Pages/SiteEngineerPage'
import OfficeAdminPage from './Pages/OfficeAdminPage'
import Login from './Pages/LoginPage'
import Signup from './Pages/SignUpPage'



const getAuthSession = () => {
  const session = localStorage.getItem("authSession");
  return session ? JSON.parse(session) : null;
};

function App(){

const auth = getAuthSession();

console.log(auth);

return (
  <Routes>

    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />


    {!auth?.employeeId && (
      <Route path="*" element={<Navigate to="/login" />} />
    )}

    {auth?.employeeId && (
      <>
        <Route path="/" element={<Home />} />

        {auth.role === "engineer" && (
          <>
            <Route path="/project" element={<Project />} />
            <Route path="/siteengg" element={<SiteEngineerPage />} />
            <Route path="/map" element={<MapPage />} />
          </>
        )}

        {auth.role === "project_manager" && (
          <Route path="/admin" element={<OfficeAdminPage />} />
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </>
    )}
  </Routes>
);
}

export default App;
