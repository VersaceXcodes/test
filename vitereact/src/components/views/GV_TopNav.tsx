import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const GV_TopNav: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const logoutUser = useAppStore(state => state.logout_user);

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

const { data: notifications, refetch: refetchNotifications } = useQuery({
  queryKey: ['notifications', currentUser?.id],
  queryFn: async () => {
    if (!authToken || !currentUser) return [] as { id: string; message: string; isRead: boolean }[];
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { user_id: currentUser.id }
    });
    return (response.data ?? []).map((notification: any) => ({
      id: notification.notification_id,
      message: notification.message,
      isRead: notification.is_read,
    }));
  },
  enabled: !!currentUser,
});

  return (
    <>
      <nav className="bg-gray-800 text-white fixed w-full top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-white">
                Logo
              </Link>
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/content-management" className="hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Content Management
                </Link>
                <Link to="/user-settings" className="hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Settings
                </Link>
              </div>
            </div>
            <div className="ml-3 relative">
              <button
                onClick={refetchNotifications}
                className="bg-gray-800 flex text-sm rounded-full text-white focus:outline-none"
                aria-label="Notifications"
              >
                <span className="sr-only">View notifications</span>
                {/* Notifications Icon */}
              </button>
              {notifications?.length > 0 && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    {notifications.map(notification => (
                      <a key={notification.id} href="#" className="block px-4 py-2 text-sm text-gray-700">
                        {notification.message}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="ml-3 relative">
              <div>
                <button className="bg-gray-800 flex text-sm rounded-full text-white focus:outline-none" aria-label="User menu">
                  <span className="sr-only">Open user menu</span>
                  {/* User Icon */}
                </button>
              </div>
              <div
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5"
                role="menu" aria-orientation="vertical" aria-labelledby="user-menu"
              >
                <a
                  href="#"
                  onClick={handleLogout}
                  className="block px-4 py-2 text-sm text-gray-700"
                  role="menuitem"
                >
                  Sign out
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default GV_TopNav;