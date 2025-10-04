import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_premium?: boolean;
  premium_expires_at?: string;
}

interface AuthenticationState {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}

interface UserPreferences {
  categories: string[];
  notifications_enabled: boolean;
}

interface PremiumFeatures {
  available_models: string[];
  current_model: string;
  usage_limit: number;
  usage_count: number;
}

interface Content {
  id: string;
  title: string;
  description: string;
  created_at: string;
  creator_id: string;
  tags: string[];
}

interface ContentState {
  content_list: Content[];
  is_loading: boolean;
  error_message: string | null;
}

interface AppState {
  authentication_state: AuthenticationState;
  user_preferences: UserPreferences;
  content_state: ContentState;
  premium_features: PremiumFeatures;

  // Actions
  login_user: (email: string, password: string) => Promise<void>;
  logout_user: () => void;
  register_user: (email: string, password: string, name: string) => Promise<void>;
  initialize_auth: () => Promise<void>;
  clear_auth_error: () => void;
  upgrade_to_premium: () => Promise<void>;
  change_model: (model: string) => void;
}

// Store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial states
      authentication_state: {
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: true,
        },
        error_message: null,
      },
      user_preferences: {
        categories: [],
        notifications_enabled: true,
      },
      content_state: {
        content_list: [],
        is_loading: true,
        error_message: null,
      },
      premium_features: {
        available_models: ['gpt-3.5-turbo'],
        current_model: 'gpt-3.5-turbo',
        usage_limit: 10,
        usage_count: 0,
      },

      // Actions
      login_user: async (email, password) => {
        set((s) => ({
          authentication_state: {
            ...s.authentication_state,
            authentication_status: { is_authenticated: false, is_loading: true },
            error_message: null,
          },
        }));

        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`,
            { email, password },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { user, auth_token } = response.data;

          set(() => ({
            authentication_state: {
              current_user: user,
              auth_token: auth_token,
              authentication_status: { is_authenticated: true, is_loading: false },
              error_message: null,
            },
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';

          set(() => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: { is_authenticated: false, is_loading: false },
              error_message: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        }
      },

      logout_user: () => {
        set(() => ({
          authentication_state: {
            current_user: null,
            auth_token: null,
            authentication_status: { is_authenticated: false, is_loading: false },
            error_message: null,
          },
        }));
      },

      register_user: async (email, password, name) => {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/register`,
            { email, password, name },
            { headers: { 'Content-Type': 'application/json' } }
          );

          // Optionally log in immediately after registration
          await get().login_user(email, password);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';

          set(() => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: { is_authenticated: false, is_loading: false },
              error_message: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        }
      },

      initialize_auth: async () => {
        const { authentication_state } = get();
        const token = authentication_state.auth_token;

        if (!token) {
          set((s) => ({
            authentication_state: {
              ...s.authentication_state,
              authentication_status: { ...s.authentication_state.authentication_status, is_loading: false },
            },
          }));
          return;
        }

        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const { user } = response.data;

          set(() => ({
            authentication_state: {
              current_user: user,
              auth_token: token,
              authentication_status: { is_authenticated: true, is_loading: false },
              error_message: null,
            },
          }));
        } catch {
          set(() => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: { is_authenticated: false, is_loading: false },
              error_message: null,
            },
          }));
        }
      },

      clear_auth_error: () => {
        set((s) => ({
          authentication_state: {
            ...s.authentication_state,
            error_message: null,
          },
        }));
      },

      upgrade_to_premium: async () => {
        set((s) => ({
          authentication_state: {
            ...s.authentication_state,
            current_user: s.authentication_state.current_user ? {
              ...s.authentication_state.current_user,
              is_premium: true,
              premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            } : null,
          },
          premium_features: {
            available_models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-opus'],
            current_model: 'gpt-4',
            usage_limit: 1000,
            usage_count: s.premium_features.usage_count,
          },
        }));
      },

      change_model: (model: string) => {
        set((s) => ({
          premium_features: {
            ...s.premium_features,
            current_model: model,
          },
        }));
      },
    }),
    {
      name: 'app-state-storage',
      partialize: (state) => ({
        authentication_state: {
          current_user: state.authentication_state.current_user,
          auth_token: state.authentication_state.auth_token,
          authentication_status: {
            is_authenticated: state.authentication_state.authentication_status.is_authenticated,
          },
        },
        user_preferences: state.user_preferences,
      }),
    }
  )
);