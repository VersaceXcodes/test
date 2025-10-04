import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name?: string;
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

interface AppStore {
  authentication_state: AuthenticationState;
  register_user: (email: string, password: string, name?: string) => Promise<void>;
  login_user: (email: string, password: string) => Promise<void>;
  logout_user: () => void;
}

const API_BASE_URL = 'http://localhost:3000/api';

export const useAppStore = create<AppStore>((set) => ({
  authentication_state: {
    current_user: null,
    auth_token: localStorage.getItem('auth_token'),
    authentication_status: {
      is_authenticated: false,
      is_loading: false,
    },
    error_message: null,
  },

  register_user: async (email: string, password: string, name?: string) => {
    try {
      set((state) => ({
        authentication_state: {
          ...state.authentication_state,
          authentication_status: {
            is_authenticated: false,
            is_loading: true,
          },
          error_message: null,
        },
      }));

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);

      set((state) => ({
        authentication_state: {
          ...state.authentication_state,
          current_user: data.user,
          auth_token: data.token,
          authentication_status: {
            is_authenticated: true,
            is_loading: false,
          },
          error_message: null,
        },
      }));
    } catch (error) {
      set((state) => ({
        authentication_state: {
          ...state.authentication_state,
          current_user: null,
          auth_token: null,
          authentication_status: {
            is_authenticated: false,
            is_loading: false,
          },
          error_message: error instanceof Error ? error.message : 'Registration failed',
        },
      }));
    }
  },

  login_user: async (email: string, password: string) => {
    try {
      set((state) => ({
        authentication_state: {
          ...state.authentication_state,
          authentication_status: {
            is_authenticated: false,
            is_loading: true,
          },
          error_message: null,
        },
      }));

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);

      set((state) => ({
        authentication_state: {
          ...state.authentication_state,
          current_user: data.user,
          auth_token: data.token,
          authentication_status: {
            is_authenticated: true,
            is_loading: false,
          },
          error_message: null,
        },
      }));
    } catch (error) {
      set((state) => ({
        authentication_state: {
          ...state.authentication_state,
          current_user: null,
          auth_token: null,
          authentication_status: {
            is_authenticated: false,
            is_loading: false,
          },
          error_message: error instanceof Error ? error.message : 'Login failed',
        },
      }));
    }
  },

  logout_user: () => {
    localStorage.removeItem('auth_token');
    set((state) => ({
      authentication_state: {
        ...state.authentication_state,
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: false,
        },
        error_message: null,
      },
    }));
  },
}));