import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { z } from 'zod';

// Zod schema for email validation
const emailSchema = z.string().email();

interface PasswordRecoveryResponse {
  message: string;
}

const UV_PasswordRecovery: React.FC = () => {
  const [email, setEmail] = useState('');
  const { mutate, isLoading, isError, isSuccess, error } = useMutation<PasswordRecoveryResponse, Error, string>({
    mutationFn: async (email) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/password-recovery`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email); // Validate email
      mutate(email);
    } catch (err) {
      console.error('Invalid email format');
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Recovery
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address to receive password recovery instructions.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {isError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">Something went wrong. Please try again.</div>}
            {isSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">Recovery instructions have been sent to your email.</div>}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Send Recovery Instructions'}
              </button>
            </div>
          </form>
          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_PasswordRecovery;