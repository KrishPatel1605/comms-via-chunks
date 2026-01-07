import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'


const Header = () => {
  const [open, setOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem("authSession");
  }
  return (
    <header className="absolute top-0 left-0 w-full z-20 bg-transparent">
      <div className="flex items-center justify-between px-4 py-7 text-white relative">

        {/* Logo */}
        <div className="flex items-center gap-4">
          <img src="/public/logo/nirmaan.png" className="w-8 h-8 scale-125" />
          <h1 className="text-4xl font-bold staatliches mt-0.5">
            NIRMAAN
          </h1>
        </div>

        {/* Menu Icon */}
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl mr-4 z-30"
        >
          {open ? <X /> : <Menu />}
        </button>

        {/* Small Modal */}
        {open && (
          <div className="absolute right-4 top-20 w-44 rounded-md bg-white text-black shadow-lg overflow-hidden">
            <ul className="flex flex-col">
              <Link to='/' className="text-[#4361ee] text-xl px-4 py-3 hover:bg-gray-100 cursor-pointer poppins">
                Home
              </Link>
              <Link to='/project' className="text-[#4361ee] text-xl px-4 py-3 hover:bg-gray-100 cursor-pointer poppins">
                Projects
              </Link>
              <li className="text-red-400 text-xl px-4 py-3 hover:bg-gray-100 cursor-pointer poppins"
              onClick={logout}>
                Logout
              </li>
            </ul>
          </div>
        )}

      </div>
    </header>
  )
}

export default Header
