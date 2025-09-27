import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { UserSettings } from '@/zodschemas';
import { Link } from 'react-router-dom';

const queryClient = new QueryClient();

const fetchUserSettings = async (userId: string, authToken: string) => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user-settings`, {
    headers: { Authorization: `Bearer ${authToken}` },
    params: { user_id: userId },
  });
  return response.data;
};

const updateUserSettings = async (settings: UserSettings & { authToken: string }) => {
  const { authToken, ...rest } = settings;
  await axios.patch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user-settings`, rest, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
};

const UV_UserSettings: React.FC = () => {
  const authToken = useAppStore((state) => state.authentication_state.auth_token);
  const currentUser = useAppStore((state) => state.authentication_state.current_user);
  
  const userId = currentUser?.id || '';

  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);

  const { data: userSettings, error, refetch } = useQuery({
    queryKey: ['userSettings', userId],
    queryFn: () => fetchUserSettings(userId, authToken!),
    enabled: !!userId && !!authToken,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (userSettings) {
      setLocalSettings(userSettings as UserSettings);
    }
  }, [userSettings]);

  const mutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => { void refetch(); },
  });

  const handleCategoriesChange = (categories: string[]) => {
    setLocalSettings((prev) => prev && { ...prev, categories });
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setLocalSettings((prev) => prev && { ...prev, notifications_enabled: enabled });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSettings || !authToken) return;
    mutation.mutate({ ...localSettings, authToken });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <>
        <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold mb-6">User Settings</h1>
          {error && <div className="text-red-500 text-sm mb-4">{(error as Error).message}</div>}
           {userSettings && localSettings && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Categories</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Comma separated categories"
                   value={localSettings?.categories?.join(', ') || ''}
                  onChange={(e) => handleCategoriesChange(e.target.value.split(', ').map(c => c.trim()))}
                />
              </div>
              <div className="mb-4 flex items-center">
                <span className="mr-3">Enable Notifications:</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                   checked={!!localSettings?.notifications_enabled}
                  onChange={(e) => handleNotificationsChange(e.target.checked)}
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="submit"
                   className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-500 text-sm">Cancel</Link>
              </div>
            </form>
          )}
        </div>
      </>
    </QueryClientProvider>
  );
};

export default UV_UserSettings;