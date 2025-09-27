import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { z } from 'zod';
import { Link } from 'react-router-dom';

// Import TypeScript types and schemas from Zod
import { contentSchema, createContentInputSchema } from '@/zodschemas';


// Ensure your API base URL is properly set in the .env file with the prefix VITE_
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Axios instance setup specific for this file
const authAxios = (token: string | null) => axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const UV_ContentManagement: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    tags: [] as string[],
  });
  
  const { data: myContent, isLoading, error } = useQuery({
    queryKey: ['fetchMyContent', currentUser?.id],
    queryFn: async () => {
      const response = await authAxios(authToken).get(`/my-content?user_id=${currentUser?.id}`);
      return z.array(contentSchema).parse(response.data);
    },
    enabled: !!currentUser,
  });

  const createContentMutation = useMutation({
    mutationFn: async (contentData: z.infer<typeof createContentInputSchema>) => {
      const response = await authAxios(authToken).post('/content', contentData);
      return contentSchema.parse(response.data);
    },
  });

  const handleCreateContent = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate content before submission
    const parsedContentData = createContentInputSchema.safeParse({
      ...newContent,
      creator_id: currentUser?.id,
    });

    if (!parsedContentData.success) {
      // Handle validation errors
      console.error('Validation error', parsedContentData.error.format());
      return;
    }

    createContentMutation.mutate(parsedContentData.data, {
      onSuccess: () => {
        setNewContent({ title: '', description: '', tags: [] });
      },
      onError: (err) => {
        console.error('Error creating content', err);
      },
    });
  };

  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Content Management Console</h1>
        
        {/* Create New Content Form */}
        <form onSubmit={handleCreateContent} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={newContent.title}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={newContent.description}
                onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                value={newContent.tags.join(', ')}
                onChange={(e) => setNewContent({ ...newContent, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={createContentMutation.isPending}
              >
                {createContentMutation.isPending ? 'Creating...' : 'Create Content'}
              </button>
          </div>
        </form>

        {/* Display Existing Content */}
        {isLoading ? (
          <p>Loading your content...</p>
        ) : error ? (
          <p className="text-red-500">Error loading content. Please try again later.</p>
        ) : (
          <div>
            {!myContent || myContent.length === 0 ? (
              <p>No content created yet.</p>
            ) : (
              <ul className="space-y-4">
                {myContent!.map(item => (
                  <li key={item.content_id} className="border border-gray-200 rounded-md p-4 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Created on: {new Date(item.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">Tags: {item.tags?.join(', ') || 'None'}</p>
                    <div className="mt-2 space-x-2">
                      <Link
                        to={`/content/${item.content_id}/edit`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/content/${item.content_id}/delete`}
                        className="text-red-600 hover:text-red-500 text-sm"
                      >
                        Delete
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default UV_ContentManagement;