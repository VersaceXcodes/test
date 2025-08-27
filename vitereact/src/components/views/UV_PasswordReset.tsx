import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

const UV_PasswordReset: React.FC = () => {
  const [resetEmail, setResetEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation(
    async (email: string) => {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/password-reset`, { email });
      return data;
    },
    {
      onSuccess: () => {
        setSuccessMessage('Password reset email sent successfully.');
        setErrorMessage(null);
        setResetEmail('');
      },
      onError: (error: any) => {
        setErrorMessage(error.response?.data?.message || 'Failed to send password reset email.');
        setSuccessMessage(null);
      }
    }
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetEmail(e.target.value);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(resetEmail);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
              Password Reset
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email to receive a password reset link.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200 text-red-700">
                <p className="text-sm" aria-live="polite">{errorMessage}</p>
              </div>
            )}
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200 text-green-700">
                <p className="text-sm" aria-live="polite">{successMessage}</p>
              </div>
            )}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={resetEmail}
                onChange={handleEmailChange}
                placeholder="Email address"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Send Reset Link
              </button>
            </div>
          </form>
          <div className="text-center text-sm">
            <Link to="/auth" className="font-medium text-blue-600 hover:text-blue-500">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_PasswordReset;