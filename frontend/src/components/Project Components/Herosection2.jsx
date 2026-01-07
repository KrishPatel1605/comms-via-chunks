import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react';


const Herosection2 = ({ onProjectClick }) => {


  const slides = [
    {
      id: 1,
      overlay: "bg-green-500/60",
      project: "Atlas Tower",
      location: "Navi Mumbai",
      src_img: "/public/image/project1.jpg",
      start: "Jan, 2026",
      end: "Dec, 2029"
    },
    {
      id: 2,
      overlay: "bg-yellow-500/60",
      project: "Orion Heights",
      location: "Pune",
      src_img: "/public/image/project2.jpg",
      start: "Mar, 2025",
      end: "Aug, 2027"
    },
    {
      id: 3,
      overlay: "bg-red-500/60",
      project: "Zenith Plaza",
      location: "Thane",
      src_img: "/public/image/project3.jpg",
      start: "Jul, 2024",
      end: "Nov, 2026"
    }
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
                //     <div
                //       key={slide.id}
                //       className={`
                //   absolute top-5 transition-all duration-500 ease-in-out
                //   h-[350px] w-[65%] shadow-xl rounded-xl p-4
                //   ${slide.color}
                // `}
                //       style={{
                //         left: "50%",
                //         transform: `
                //     translateX(${offset * 70 - 50}%)
                //     scale(${index === current ? 1.1 : 1})
                //   `,
                //         zIndex: index === current ? 50 : 20,
                //       }}

                //       onClick={() => onProjectClick(slide)}
                //     >

                <div
                  key={slide.id}
                  className="absolute top-5 transition-all duration-500 ease-in-out
             h-[350px] w-[65%] shadow-xl rounded-xl overflow-hidden"
                  style={{
                    left: "50%",
                    backgroundImage: `url(${slide.src_img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transform: `
      translateX(${offset * 70 - 50}%)
      scale(${index === current ? 1.1 : 1})
    `,
                    zIndex: index === current ? 50 : 20,
                  }}
                  onClick={() => onProjectClick(slide)}
                >

                  {/* Overlay */}
                  <div className={`absolute inset-0 ${slide.overlay}`} />

                  {/* <div className='flex flex-col items-start justify-between h-full w-full'>
                    <div>
                      <div className='text-4xl text-white staatliches_ns'>{slide.project}</div>
                      <div className='w-[60%] bg-white h-2' />
                      <div className='text-xl poppins mt-2 text-white'>{slide.location}</div>
                    </div>

                    <div className='flex items-center justify-between w-full text-xl text-white poppins'>
                      <div>{slide.start}</div>
                      <div>{slide.end}</div>
                    </div>
                  </div> */}
                  <div className="relative z-10 flex flex-col items-start justify-between h-full w-full p-4">
                    <div>
                      <div className="text-4xl text-white staatliches_ns">
                        {slide.project}
                      </div>
                      <div className="w-[60%] bg-white h-2" />
                      <div className="text-xl poppins mt-2 text-white">
                        {slide.location}
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full text-xl text-white poppins">
                      <div>{slide.start}</div>
                      <div>{slide.end}</div>
                    </div>
                  </div>
                </div>
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
