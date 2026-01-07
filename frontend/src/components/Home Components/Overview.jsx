import React, { useEffect, useState } from 'react'
import { Calendar, ClipboardList, Paperclip } from 'lucide-react'
import { Link } from "react-router-dom";
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

const Overview = () => {

  const [auth, setAuth] = useState(null); // ✅ correct place

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
    <div className='relative min-h-screen w-full'>
      <div className="absolute top-0 left-0 z-0 pointer-events-none w-full h-[450px] rounded-b-4xl bg-[#4361ee]" />

      <div className='relative z-10'>
        <div className='z-10 px-8'>
          <div className='text-4xl staatliches text-white py-8'>Overview</div>

          <div className='text-lg poppins text-white mt-5'>
            Nirmaan collaborates with {auth.company} with an aim to create a single, reliable digital platform for managing construction projects, enabling real-time progress tracking, controlled material workflows, and seamless collaboration between site and office teams.
          </div>
        </div>

        <div className='mt-45 text-xl poppins text-center text-[#4361ee]'>
          How Nirmaan Helps Site Engineers
        </div>

        <div className="flex items-center justify-center mt-5">
          <div className="w-[90%] py-15 bg-[#4361ee] rounded-3xl flex flex-col items-center justify-center">
            <div className="flex justify-between w-full px-8">

              <Link to="/project" className="flex flex-col items-center gap-2 hover:scale-105 transition">
                <div className="p-4 rounded-lg bg-white">
                  <Paperclip className="text-gray-600" />
                </div>
                <div className="text-white text-lg poppins text-center">
                  Project <br /> Details
                </div>
              </Link>

              <Link to="/request-materials" className="flex flex-col items-center gap-2 hover:scale-105 transition">
                <div className="p-4 rounded-lg bg-white">
                  <ClipboardList className="text-gray-600 scale-110" />
                </div>
                <div className="text-white text-lg poppins text-center">
                  Request <br /> Materials
                </div>
              </Link>

              <Link to="/schedule-meet" className="flex flex-col items-center gap-2 hover:scale-105 transition">
                <div className="p-4 rounded-lg bg-white">
                  <Calendar className="text-gray-600" />
                </div>
                <div className="text-white text-lg poppins text-center">
                  Schedule <br /> Meet
                </div>
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
