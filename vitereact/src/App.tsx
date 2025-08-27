import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Import views
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Sidebar from '@/components/views/GV_Sidebar.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import UV_Landing from '@/components/views/UV_Landing.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_Signup from '@/components/views/UV_Signup.tsx';
import UV_PasswordRecovery from '@/components/views/UV_PasswordRecovery.tsx';
import UV_Dashboard from '@/components/views/UV_Dashboard.tsx';
import UV_ContentDetail from '@/components/views/UV_ContentDetail.tsx';
import UV_ContentManagement from '@/components/views/UV_ContentManagement.tsx';
import UV_UserSettings from '@/components/views/UV_UserSettings.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const initializeAuth = useAppStore(state => state.initialize_auth);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="App min-h-screen flex flex-col">
          <GV_TopNav />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<UV_Landing />} />
              <Route path="/login" element={<UV_Login />} />
              <Route path="/signup" element={<UV_Signup />} />
              <Route path="/password-recovery" element={<UV_PasswordRecovery />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><UV_Dashboard /></ProtectedRoute>} />
              <Route path="/content/:content_id" element={<ProtectedRoute><UV_ContentDetail /></ProtectedRoute>} />
              <Route path="/content-management" element={<ProtectedRoute><UV_ContentManagement /></ProtectedRoute>} />
              <Route path="/user-settings" element={<ProtectedRoute><UV_UserSettings /></ProtectedRoute>} />

              {/* Catch all - redirect based on auth status */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <GV_Footer />
          </main>
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;