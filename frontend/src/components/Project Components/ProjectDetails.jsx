import React, { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Hash, Home, MapPin, Ruler } from 'lucide-react'

const ProjectDetails = () => {

  const slides = [
    { id: 1, color: "bg-green-400" },
    { id: 2, color: "bg-yellow-400" },
    { id: 3, color: "bg-red-400" }
  ]

  const [current, setCurrent] = useState(0)

  const prevSlide = () => {
    setCurrent(prev => prev === 0 ? slides.length - 1 : prev - 1)
  }

  const nextSlide = () => {
    setCurrent(prev => prev === slides.length - 1 ? 0 : prev + 1)
  }

  return (
    <div className="relative min-h-screen w-full">

      {/* Background */}
      <div className="absolute top-0 left-0 z-0 w-full h-[650px] rounded-b-3xl bg-[#4361ee]" />

      <div className="relative z-10 flex flex-col items-center">

        <h1 className="text-4xl text-white font-bold mt-8 staatliches_ns">
          Project : Atlas
        </h1>

        {/* Project Info */}
        <div className="flex justify-between w-[80%] mt-6 text-white">

          <div className="flex flex-col gap-5">
            <Info label="Code" value="ID2026#1" icon={<Hash />} />
            <Info label="Start" value="Jan, 2026" icon={<Calendar />} />
            <Info label="Type" value="Residential" icon={<Home />} />
          </div>

          <div className="flex flex-col gap-5">
            <Info label="Location" value="Kharghar" icon={<MapPin />} />
            <Info label="End" value="Jan, 2029" icon={<Calendar />} />
            <Info label="Area" value="12.5 Acres" icon={<Ruler />} />
          </div>

        </div>

        {/* Progress */}
        <div className="mt-5 w-[80%] text-white">
          <p className="text-xl mb-2">Project Status: Pending (66%)</p>
          <div className="h-4 bg-white rounded-full p-1">
            <div className="h-full w-[66%] bg-[#4361ee] rounded-full" />
          </div>
        </div>

        {/* Slider */}
        <div className="relative w-full mt-6 h-[420px] flex items-center justify-center">

          <div className="relative w-[90%] h-full">
            {slides.map((slide, index) => {
              const offset = index - current

              return (
                <div
                  key={slide.id}
                  className={`
                    absolute top-10 left-1/2
                    h-[300px] w-[60%]
                    rounded-xl shadow-xl transition-all duration-500
                    ${slide.color}
                  `}
                  style={{
                    transform: `
                      translateX(${offset * 60}%)
                      translateX(-50%)
                      scale(${index === current ? 1.1 : 0.9})
                    `,
                    zIndex: index === current ? 50 : 20,
                  }}
                />
              )
            })}
          </div>

          {/* Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-5 bottom-50 z-50 bg-black/50 text-white p-2 rounded-full"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-5 bottom-50 z-50 bg-black/50 text-white p-2 rounded-full"
          >
            <ChevronRight />
          </button>

        </div>

        <div className='flex items-center justify-between gap-2 w-full mt-5 px-4'>
          <button className='w-full rounded-md border-blue-500 border-2 text-blue-500 bg-white text-xl poppins px-2 py-1'>
            Submit DPR
          </button>

          <button className='w-full rounded-md bg-blue-500 text-white border-2 border-blue-500 text-xl poppins px-2 py-1'>
            Request Materials
          </button>

        </div>
      </div>
    </div>
  )
}

const Info = ({ label, value, icon }) => (
  <div>
    <div className="flex items-center gap-2 text-xl poppins">
      {icon}
      {label}
    </div>
    <div className="ml-8 text-gray-200 text-lg inter">{value}</div>
  </div>
)

export default ProjectDetails
