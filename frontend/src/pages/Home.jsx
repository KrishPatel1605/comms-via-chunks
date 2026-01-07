import React from 'react'
import Header from '../Components/Header'
import Herosection from '../Components/Home Components/Herosection'
import Overview from '../Components/Home Components/Overview'

const Home = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -left-72 -top-20 w-[160%] h-[700px] bg-[#4361ee] rounded-full"></div>
        <div className="absolute -right-72 -top-20 w-[160%] h-[700px] bg-[#4361ee] rounded-full"></div>
      </div>

      {/* Foreground */}
      <Header />
      <Herosection />
      <Overview />

    </div>
  )
}


export default Home
