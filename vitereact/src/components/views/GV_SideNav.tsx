import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_SideNav: React.FC = () => {
  const tasks = useAppStore(state => state.task_state.tasks);
  const setSelectedTask = useAppStore(state => state.set_selected_task);
  
  const navigateToCreateTask = () => {
    window.location.href = '/tasks/create'; // Alternatively, use <Link to="/tasks/create"> for navigational elements
  };

  const handleTaskSelection = (task_id: string) => {
    setSelectedTask(task_id);
  };

  return (
    <>
      <nav className="flex flex-col w-64 h-full bg-gray-800 text-white">
        <div className="flex items-center justify-center mt-10">
          <h1 className="text-3xl font-semibold">TaskNav</h1>
        </div>
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Task Categories</h2>
              <ul>
                {['Urgent', 'Design', 'Review'].map(category => (
                  <li key={category} className="mb-2">
                    <button onClick={() => console.log(`Filter by ${category}`)} className="hover:underline">
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Tasks</h2>
              <ul>
                {tasks.map(task => (
                  <li key={task.task_id} className="mb-2">
                    <Link
                      to={`/tasks/${task.task_id}`}
                      className="hover:underline"
                      onClick={() => handleTaskSelection(task.task_id)}
                    >
                      {task.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <button
                onClick={navigateToCreateTask}
                className="w-full text-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Create New Task
              </button>
            </div>
          </div>

          <div className="mt-auto">
            <h2 className="text-xl font-bold mb-4">Collaboration</h2>
            <button
              onClick={() => console.log("Open collaboration room")}
              className="w-full text-left py-2 px-4 text-sm"
            >
              Open Collaboration Room
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default GV_SideNav;