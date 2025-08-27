import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_Footer: React.FC = () => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);

  return (
    <>
      <footer className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-base">© {new Date().getFullYear()} Test Platform. All rights reserved.</span>
            <div className="flex space-x-4 mt-2">
              <Link to="/" className="text-gray-400 hover:text-white text-sm">Home</Link>
              <a href="https://example.com/privacy" className="text-gray-400 hover:text-white text-sm" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <a href="https://example.com/terms" className="text-gray-400 hover:text-white text-sm" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            </div>
          </div>
          <div>
            <h2 className="text-base mb-2">Connect with us:</h2>
            <div className="flex space-x-4">
              <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter text-blue-500"></i>
              </a>
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook text-blue-800"></i>
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin text-blue-700"></i>
              </a>
            </div>
          </div>
          {isAuthenticated && (
            <div className="mt-4 md:mt-0">
              <Link to="/dashboard" className="text-gray-400 hover:text-white text-sm">Dashboard</Link>
              <button onClick={() => useAppStore.getState().logout_user()} className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm">Logout</button>
            </div>
          )}
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;