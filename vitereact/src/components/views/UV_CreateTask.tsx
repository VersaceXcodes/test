import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_CreateTask: React.FC = () => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [assignedUsers, setAssignedUsers] = useState('');

  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const {
    mutate: createTask,
    isLoading,
    isError,
    error,
    isSuccess,
  } = useMutation(
    async () => {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tasks`, {
        title: taskTitle,
        description: taskDescription,
        due_date: dueDate || null,
        tags: tags.split(',').map(tag => tag.trim()),
        assigned_users: assignedUsers.split(',').map(user => user.trim()),
        created_by: currentUser?.user_id,
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        // Reset form states and redirect or notify user
        setTaskTitle('');
        setTaskDescription('');
        setDueDate('');
        setTags('');
        setAssignedUsers('');
        // Navigate or show success notification
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask();
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-xl w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Create a New Task</h2>
          
          {isError && <div aria-live="polite" className="text-red-500">{(error as any)?.response?.data?.message || 'An error occurred'}</div>}
          {isSuccess && <div aria-live="polite" className="text-green-500">Task created successfully!</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="taskTitle" className="sr-only">Task Title</label>
              <input
                id="taskTitle"
                name="taskTitle"
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task Title"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="taskDescription" className="sr-only">Task Description</label>
              <textarea
                id="taskDescription"
                name="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Task Description"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div>
              <label htmlFor="dueDate" className="sr-only">Due Date</label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tags" className="sr-only">Tags</label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="assignedUsers" className="sr-only">Assign to Users</label>
              <input
                id="assignedUsers"
                name="assignedUsers"
                type="text"
                value={assignedUsers}
                onChange={(e) => setAssignedUsers(e.target.value)}
                placeholder="Assign to Users (comma separated user IDs)"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-between">
              <Link to="/dashboard" className="inline-block text-sm font-medium text-blue-600 hover:text-blue-500">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_CreateTask;