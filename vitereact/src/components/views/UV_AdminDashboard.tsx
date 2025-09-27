import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface UserActivity {
  user_id: string;
  activity: string;
  count: number;
}

const fetchUserActivityMetrics = async (): Promise<UserActivity[]> => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${useAppStore.getState().authentication_state.auth_token}` }
  });
  
  return response.data.metrics.map((metric: any) => ({
    user_id: metric.user_id,
    activity: metric.activity_type,
    count: metric.activity_count,
  }));
};

const UV_AdminDashboard: React.FC = () => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  const { data: userActivities, isLoading, isError } = useQuery({
    queryKey: ['userActivityMetrics'],
    queryFn: fetchUserActivityMetrics,
    enabled: isAuthenticated,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      {isAuthenticated && currentUser?.role === 'Admin' ? (
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-white shadow-md mb-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                </div>
                <div className="flex items-center">
                  <Link to="/admin/reports" className="text-blue-600 hover:text-blue-800">
                    Generate Reports
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin border-t-2 border-b-2 border-blue-500 rounded-full w-12 h-12"></div>
              </div>
            ) : isError ? (
              <div className="text-red-600 text-center">Error loading user activity metrics.</div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">User Activities</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Summarized user engagement metrics.</p>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    {userActivities?.map(activity => (
                      <div key={activity.user_id} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">{activity.activity}</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{activity.count}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-700">You do not have permission to access this page.</p>
        </div>
      )}
    </>
  );
};

export default UV_AdminDashboard;