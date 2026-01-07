
import React, { useState } from 'react'
import Header from '../Components/Header'
import Herosection2 from '../components/Project Components/Herosection2'
import ProjectDetails from '../components/Project Components/ProjectDetails'
import SitePlan from '../components/Project Components/SitePlan'
import TaskList from '../components/Project Components/TaskList'

const Project = () => {

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  const openProjectModal = (project) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  const closeProjectModal = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[100%] h-[700px] bg-[#4361ee] rounded-b-4xl"></div>
      </div>

      {/* Foreground */}
      <Header />
      <Herosection2 onProjectClick={openProjectModal} />

      {/* MODAL */}
      {/* {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-lg">

            <h2 className="text-2xl font-bold mb-4">
              Project #{selectedProject?.id}
            </h2>

            <div
              className={`h-32 rounded-lg mb-4 ${selectedProject?.color}`}
            />

            <p className="text-gray-600">
              This is where you’ll show site details, DPRs, photos, materials etc.
            </p>

            <button
              onClick={closeProjectModal}
              className="mt-6 px-4 py-2 bg-black text-white rounded-lg"
            >
              Close
            </button>

          </div>
        </div>
      )} */}

      {isModalOpen && (
        <>
          <ProjectDetails />
          <SitePlan />
          <TaskList />
        </>
      )}

    </div>
  )
}

export default Project
