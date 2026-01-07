import { Check, Clock } from 'lucide-react';
import React from 'react'

const TaskList = () => {

  const projectTasks = [
    { id: 1, title: "Site clearance and leveling", category: "Pre-Construction", status: "completed" },
    { id: 2, title: "Temporary site fencing installation", category: "Pre-Construction", status: "completed" },
    { id: 3, title: "Soil testing and survey", category: "Pre-Construction", status: "completed" },

    { id: 4, title: "Excavation for foundation", category: "Foundation", status: "completed" },
    { id: 5, title: "PCC laying for foundation", category: "Foundation", status: "completed" },
    { id: 6, title: "Footing reinforcement work", category: "Foundation", status: "completed" },
    { id: 7, title: "Foundation concrete pouring", category: "Foundation", status: "completed" },

    { id: 8, title: "Column reinforcement - Ground floor", category: "Structural", status: "completed" },
    { id: 9, title: "Column shuttering - Ground floor", category: "Structural", status: "completed" },
    { id: 10, title: "Column concrete pouring - Ground floor", category: "Structural", status: "completed" },

    { id: 11, title: "Slab formwork installation", category: "Structural", status: "pending" },
    { id: 12, title: "Slab reinforcement work", category: "Structural", status: "pending" },
    { id: 13, title: "Slab concrete pouring", category: "Structural", status: "pending" },

    { id: 14, title: "Brick masonry - Ground floor", category: "Masonry", status: "pending" },
    { id: 15, title: "Electrical conduit laying", category: "Electrical", status: "pending" },
    { id: 16, title: "Plumbing pipeline installation", category: "Plumbing", status: "pending" },

    { id: 17, title: "Internal plastering", category: "Finishing", status: "pending" },
    { id: 18, title: "External plastering", category: "Finishing", status: "pending" },
    { id: 19, title: "Flooring work", category: "Finishing", status: "pending" },

    { id: 20, title: "Door and window frame fixing", category: "Carpentry", status: "pending" },
    { id: 21, title: "Painting - Interior", category: "Painting", status: "pending" },
    { id: 22, title: "Painting - Exterior", category: "Painting", status: "pending" },

    { id: 23, title: "Final electrical fittings installation", category: "Electrical", status: "pending" },
    { id: 24, title: "Final plumbing fixture installation", category: "Plumbing", status: "pending" },
    { id: 25, title: "Final site cleaning and handover preparation", category: "Handover", status: "pending" },
  ];



  return (
    <div className="relative min-h-screen w-full">
      <div className='mt-5 text-4xl text-[#4361ee] p-5 staatliches_ns'>Project TaskList</div>


      <ul className="space-y-3 mt-5 mb-5">
       
        {projectTasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between gap-2 px-5 rounded-lg"
          >
            <div>
              <p className="text-xl poppins-semi text-[#556fe3]">{task.title}</p>
              <p className="inter text-gray-600">{task.category}</p>
            </div>

            <span
              className='px-3 py-1 text-sm rounded-full'
            >
              {task.status === "completed" ? (
                <Check className='scale-110 text-green-500' />
              )
                :
                (
                  <Clock className='scale-110 text-yellow-500'/>
                )
              }
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TaskList
