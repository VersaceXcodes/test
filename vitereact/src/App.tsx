import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const navigate = useNavigate();
  
  const { register_user, login_user, authentication_state } = useAppStore();
  const { is_loading } = authentication_state.authentication_status;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isRegisterMode) {
        await register_user(email, password, name || undefined);
      } else {
        await login_user(email, password);
      }
      
      // Navigation after successful auth will be handled by the store
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>{isRegisterMode ? 'Create Account' : 'Sign In'}</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isRegisterMode && (
          <div>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <button
          type="submit"
          disabled={is_loading || !email || !password}
          style={{ 
            padding: '0.75rem',
            backgroundColor: is_loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: is_loading ? 'not-allowed' : 'pointer'
          }}
        >
          {is_loading ? 'Loading...' : isRegisterMode ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button 
          type="button"
          onClick={toggleMode}
          style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {isRegisterMode ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
      
      {authentication_state.error_message && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          {authentication_state.error_message}
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { authentication_state, logout_user } = useAppStore();
  const { current_user } = authentication_state;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {current_user?.name || current_user?.email}!</p>
      <button onClick={logout_user} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
        Logout
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </div>
  );
};

export default App;