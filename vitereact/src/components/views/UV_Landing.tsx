import React from 'react';
import { Link } from 'react-router-dom';

const UV_Landing: React.FC = () => {
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Test Platform</h1>
          <p className="text-lg mb-8">
            Explore the features of our platform and join today to experience personalized content.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/signup"
              className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-md shadow hover:bg-gray-100 transition"
              aria-label="Sign Up to Test Platform"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="bg-transparent border border-white text-white font-semibold px-6 py-2 rounded-md shadow hover:bg-white hover:text-blue-600 transition"
              aria-label="Log In to Test Platform"
            >
              Log In
            </Link>
          </div>
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold">Why Choose Us?</h2>
            <p className="mt-4">
              Experience seamless access to content, personalized recommendations, and a vibrant community.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Landing;