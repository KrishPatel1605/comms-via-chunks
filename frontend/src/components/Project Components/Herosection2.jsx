import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react';


const Herosection2 = ({ onProjectClick }) => {


  const slides = [
    { id: 1, color: "bg-green-400" },
    { id: 2, color: "bg-yellow-400" },
    { id: 3, color: "bg-red-400" },
    { id: 4, color: "bg-blue-400" },
  ];

  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrent((prev) =>
      prev === slides.length - 1 ? 0 : prev + 1
    );
  };


  return (
    <div className="relative z-10 min-h-screen w-full">

      <div className="mt-30 px-5">
        <h1 className="text-4xl font-bold text-white staatliches">
          Projects
        </h1>

        <div className='relative py-2'>

          <div className="relative w-full mt-10 h-[400px] overflow-hidden">

            {slides.map((slide, index) => {
              const offset = index - current;

              return (
                <div
                  key={slide.id}
                  className={`
              absolute top-5 transition-all duration-500 ease-in-out
              h-[350px] w-[65%] shadow-xl rounded-xl
              ${slide.color}
            `}
                  style={{
                    left: "50%",
                    transform: `
                translateX(${offset * 70 - 50}%)
                scale(${index === current ? 1.1 : 1})
              `,
                    zIndex: index === current ? 50 : 20,
                  }}

                  onClick={() => onProjectClick(slide)}
                />
              );

            })}
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-2 -bottom-15 -translate-y-1/2 z-50 bg-black/60 text-white px-2 py-2 rounded-full"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 -bottom-15 -translate-y-1/2 z-50 bg-black/60 text-white px-2 py-2 rounded-full"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className='text-blue-500 w-full mt-25 flex flex-col gap-3 items-center justify-center'>
        <div className='staatliches_ns text-3xl'>Stay on top of your site work</div>
        <div className='flex flex-col items-center justify-center gap-1 text-lg poppins text-center'>
          <div className='max-w-[450px]'>Access all projects assigned by your Company</div>
          <div className='max-w-[400px]'>Submit Daily Progress Reports, upload site photos, and track material requests effortlessly</div>
        </div>
      </div>

    </div>
  )
}

export default Herosection2
