import React, { useState, useEffect } from 'react';
import { openDB } from '../../utils/db.js';

const getAuthSession = () => {
  const session = localStorage.getItem("authSession");
  return session ? JSON.parse(session) : null;
};

const getAuthFromIndexedDB = async (employeeId) => {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");

    const request = store.get(employeeId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

const Herosection = () => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const loadAuth = async () => {
      const session = getAuthSession();
      if (!session?.employeeId) return;

      const user = await getAuthFromIndexedDB(session.employeeId);
      setAuth(user);
    };

    loadAuth();
  }, []);

  if (!auth) return null;

  return (
    <div className="relative z-10 min-h-screen w-full">
      <div className="mt-30 px-4">
        <div className="text-5xl font-bold text-white staatliches">
          Engineer {auth.name}
        </div>

        <div className="text-2xl font-bold text-white poppins mt-3">
          NIRMAAN WELCOMES YOU!!
        </div>

        <div className="w-full flex justify-center mt-30">
          <img src="/public/logo/nirmaan.png" className="w-25 h-25 scale-125" />
        </div>

        
        <div className='mt-50 w-full flex flex-col items-center justify-center'>
          <div className='h-2 w-8 bg-[#4361ee] rounded-full'></div>

          <div className='font-medium text-3xl  max-w-[400px] px-4 text-center mt-12 text-[#4361ee]'>Nirmaan - Digitizing and Centralizing The World of Civil Engineering</div>
        </div>

      </div>
    </div>
  );
};

export default Herosection;


