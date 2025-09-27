import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

const GV_Sidebar: React.FC = () => {
  const categories = useAppStore(state => state.user_preferences.categories);
  const isLoading = useAppStore(state => state.content_state.is_loading);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const fetchCategories = async () => {
    if (!currentUser) throw new Error('User not authenticated');

    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/dashboard`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        params: {
          user_id: currentUser.id
        }
      }
    );

    return response.data.content.map((content: { categories: string[] }) => content.categories).flat();
  };

  const { isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories', currentUser?.id],
    queryFn: fetchCategories,
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || isCategoriesLoading) {
    return (
      <div className="fixed left-0 w-64 bg-gray-800 text-white h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed left-0 w-64 bg-gray-800 text-white h-full flex flex-col p-4">
        <h2 className="text-lg font-bold mb-4">Navigation</h2>
        <nav>
          <ul className="space-y-2">
            {categories.map((category, index) => (
              <li key={index}>
                <Link to={`/content/${category}`} className="hover:bg-gray-700 p-2 block rounded">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-4">
          <Link to="/settings" className="hover:bg-gray-700 p-2 block rounded">
            Settings
          </Link>
          <Link to="/content-management" className="hover:bg-gray-700 p-2 block mt-2 rounded">
            Manage Content
          </Link>
        </div>
      </div>
    </>
  );
};

export default GV_Sidebar;