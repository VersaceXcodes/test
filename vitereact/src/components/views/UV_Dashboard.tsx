import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { contentSchema, Content } from '@/zodschemas';
import { z } from 'zod';

const fetchDashboardContent = async (userId: string, authToken: string): Promise<Content[]> => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/dashboard`,
    {
      params: { user_id: userId },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  // Validate and coerce to array of Content
  const data = response.data;
  const arraySchema = z.array(contentSchema);
  return arraySchema.parse(data);
};

const UV_Dashboard: React.FC = () => {
  // Access global store state and actions individually
  const userId = useAppStore((state) => state.authentication_state.current_user?.id);
  const authToken = useAppStore((state) => state.authentication_state.auth_token);
  const currentUser = useAppStore((state) => state.authentication_state.current_user);
  const premiumFeatures = useAppStore((state) => state.premium_features);
  const upgradeToPromium = useAppStore((state) => state.upgrade_to_premium);
  const changeModel = useAppStore((state) => state.change_model);

  // Perform a query with react-query
  const { data: contentFeed, isLoading, error } = useQuery({
    queryKey: ['dashboardContent', userId],
    queryFn: () => fetchDashboardContent(userId!, authToken!),
    enabled: !!userId && !!authToken,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
      } as any));
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
         <p className="text-sm">Error loading content: {(error as Error).message}</p>
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

            {/* Premium Model Section */}
            <div className="mb-8 bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Model</h3>
                {currentUser?.is_premium ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Free
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Model
                  </label>
                  <select
                    id="model-select"
                    value={premiumFeatures.current_model}
                    onChange={(e) => changeModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!currentUser?.is_premium && premiumFeatures.available_models.length > 1}
                  >
                    {premiumFeatures.available_models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {!currentUser?.is_premium && (
                    <p className="mt-1 text-sm text-gray-500">
                      Upgrade to premium to access advanced models
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage This Month
                  </label>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((premiumFeatures.usage_count / premiumFeatures.usage_limit) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {premiumFeatures.usage_count} / {premiumFeatures.usage_limit} requests
                    </p>
                  </div>
                </div>
              </div>
              
              {!currentUser?.is_premium && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Upgrade to Premium</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Access GPT-4, Claude, and other advanced AI models
                      </p>
                      <ul className="mt-2 text-sm text-gray-500">
                        <li>• 1000 monthly requests</li>
                        <li>• Access to latest models</li>
                        <li>• Priority support</li>
                      </ul>
                    </div>
                    <button
                      onClick={upgradeToPromium}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              )}
              
              {currentUser?.is_premium && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Premium Active</p>
                      <p className="text-sm text-gray-600">
                        Your premium subscription expires on {currentUser.premium_expires_at ? new Date(currentUser.premium_expires_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!contentFeed || contentFeed.length === 0 ? (
              <p className="text-gray-600">No content available</p>
            ) : (
              <ul>
                {contentFeed.map((content) => (
                  <li key={content.content_id} className="mb-4 p-4 bg-white shadow rounded-md">
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