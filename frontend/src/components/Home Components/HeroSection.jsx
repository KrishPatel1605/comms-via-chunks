import React from 'react'


const Herosection = () => {
  return (
    <div className="relative z-10 min-h-screen w-full border-0 ">
      
      <div className="mt-30 px-4">
        <div className="text-5xl font-bold text-white staatliches">
          Engineer Ravi
        </div>
        <div className="text-2xl font-bold text-white poppins mt-3">
          NIRMAAN WELCOMES YOU!!
        </div>

        <div className='w-full flex items-center justify-center mt-30'>
          <img src="/public/logo/nirmaan.png" className='w-25 h-25 scale-125' />
        </div>
      </div>


      <div className='mt-50 w-full flex flex-col items-center justify-center'>
        <div className='h-2 w-8 bg-[#4361ee] rounded-full'></div>

        <div className='font-medium text-3xl  max-w-[400px] px-4 text-center mt-12 text-[#4361ee]'>Nirmaan - Digitizing and Centralizing The World of Civil Engineering</div>
      </div>
    </div>
  )
}

export default Herosection
