import React, { useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const UV_TaskDetails: React.FC = () => {
  const { task_id } = useParams<{ task_id: string }>();
 
  // Zustand store selectors
  const auth_token = useAppStore(state => state.authentication_state.auth_token);
  const isAuthenticated = useAppStore(
    state => state.authentication_state.authentication_status.is_authenticated
  );

  const fetchTaskDetails = async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tasks/${task_id}`,
      { headers: { Authorization: `Bearer ${auth_token}` } }
    );
    return response.data;
  };

  const { data: taskDetails, error, isLoading } = useQuery(
    ['taskDetails', task_id],
    fetchTaskDetails,
    { enabled: !!task_id && isAuthenticated }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <p>Error fetching task details: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-semibold mb-4">{taskDetails?.title}</h1>
        <p className="mb-2"><strong>Description:</strong> {taskDetails?.description}</p>
        <p className="mb-2"><strong>Due Date:</strong> {new Date(taskDetails?.due_date).toLocaleDateString()}</p>

        {/* Tags */}
        <div className="mb-4">
          <strong>Tags:</strong>
          <ul className="list-inside list-disc">
            {taskDetails?.tags.map((tag: string) => (
              <li key={tag} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">{tag}</li>
            ))}
          </ul>
        </div>

        {/* Assigned Users */}
        <div className="mb-4">
          <strong>Assigned Users:</strong>
          <ul className="list-inside list-disc">
            {taskDetails?.assigned_users.map((user_id: string) => (
              <li key={user_id}>{user_id}</li>
            ))}
          </ul>
        </div>

        {/* Comments */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Comments:</h3>
          <ul className="list-inside list-disc">
            {taskDetails?.comments.map((comment: any) => (
              <li key={comment.comment_id}>
                <p>{comment.content}</p>
                <small>{new Date(comment.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </div>

        {/* Back to Dashboard Link */}
        <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>

        {/* Edit and Delete options */}
        <div className="flex space-x-4 mt-8">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Edit Task</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded">Delete Task</button>
        </div>
      </div>
    </>
  );
};

export default UV_TaskDetails;