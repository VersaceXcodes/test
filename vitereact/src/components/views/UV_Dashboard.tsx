import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery, QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { contentSchema, Content } from '@/store/zodschemas'; // Assuming that Content schema is exported from the zodschemas file

// Create a query client instance
const queryClient = new QueryClient();

const fetchDashboardContent = async (userId: string): Promise<Content[]> => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/dashboard`,
    {
      params: { user_id: userId },
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`,
      },
    }
  );

  // Validate response using zod
  return contentSchema.parse(response.data);
};

const UV_Dashboard: React.FC = () => {
  // Access global store state and actions individually
  const userId = useAppStore((state) => state.authentication_state.current_user?.id);
  const authToken = useAppStore((state) => state.authentication_state.auth_token);

  // Perform a query with react-query
  const { data: contentFeed, isLoading, error } = useQuery(
    ['dashboardContent', userId],
    () => fetchDashboardContent(userId!),
    {
      enabled: !!userId && !!authToken,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Map content_feed into state on success
  useEffect(() => {
    if (contentFeed) {
      useAppStore.setState((state) => ({
        content_state: {
          ...state.content_state,
          content_list: contentFeed,
          is_loading: false,
          error_message: null,
        },
      }));
    }
  }, [contentFeed]);

  // Return loading spinner if loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Return error message if error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="text-sm">Error loading content: {error}</p>
      </div>
    );
  }

  // Main component return
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/content-management"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Content Management
                </Link>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                  onClick={() => useAppStore.getState().logout_user()}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to your dashboard!
            </h2>

            {!contentFeed || contentFeed.length === 0 ? (
              <p className="text-gray-600">No content available</p>
            ) : (
              <ul>
                {contentFeed.map((content) => (
                  <li key={content.id} className="mb-4 p-4 bg-white shadow rounded-md">
                    <h3 className="text-lg font-bold">{content.title}</h3>
                    <p className="text-sm text-gray-700">{content.description}</p>
                    <div className="text-sm text-gray-500">
                      <span>Created by: {content.creator_id}</span>
                      <span> / Created at: {new Date(content.created_at).toLocaleDateString()}</span>
                    </div>
                    {content.tags && content.tags.length > 0 && (
                      <div className="mt-2">
                        {content.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 mr-2"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_Dashboard;