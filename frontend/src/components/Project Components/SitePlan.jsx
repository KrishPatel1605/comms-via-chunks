import React from 'react'

const SitePlan = () => {
  return (
    <div className="relative min-h-screen w-full">

      {/* Background */}
      {/* <div className="absolute top-0 left-0 z-0 w-full h-[650px] rounded-b-3xl bg-[#4361ee]" /> */}

      <div className='text-4xl text-[#4361ee] p-5 staatliches_ns'>Project Planning</div>

      <div className='mt-3 w-full flex flex-col items-center'>
        <img src="/public/image/site_plan1.png" className='scale-90' />
        <div className='text-3xl text-[#4361ee] mt-2 staatliches_ns'>Site Plan</div>
      </div>

      <div className='mt-5 w-full flex flex-col items-center'>
        <img src="/public/image/site_status1.png" className='scale-90' />
        <div className='text-3xl text-[#4361ee] mt-2 staatliches_ns'>Construction Status</div>
      </div>

      <div className='flex flex-col items-start gap-3 w-full px-5 mt-10'>
        <div className='text-[#4361ee] staatliches_ns text-3xl'>Development Scale</div>

        <div className='flex flex-col items-start gap-2 ml-4'>
          <div className='text-xl text-blue-500 poppins'>
            Total Site Area:
            <span className='ml-2 text-lg text-gray-500 poppins'>12.5 Acres</span>
          </div>

          <div className='text-xl text-blue-500 poppins'>
            Total Residential Units:
            <span className='ml-2 text-lg text-gray-500 poppins'>500 Units</span>
          </div>

          <div className='text-xl text-blue-500 poppins'>
            Total Number of Buildings:
            <span className='ml-2 text-lg text-gray-500 poppins'>7 Structures</span>
          </div>

          <div className='text-xl text-blue-500 poppins'>
            Zoning:
            <span className='ml-2 text-lg text-gray-500 poppins'>Commercial / Residential</span>
          </div>  
        </div>
      </div>
    </div>
  )
}

export default SitePlan
