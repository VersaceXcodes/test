import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_ReportGeneration: React.FC = () => {
  // Local state for report criteria
  const [reportCriteria, setReportCriteria] = useState({
    start_date: '',
    end_date: '',
    user_id: '',
  });

  // Access auth token from global state
  const authToken = useAppStore((state) => state.authentication_state.auth_token);

  // Function to handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReportCriteria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to transform the API response to a CSV format for download
  const transformResponseToCSV = (_data: any): string => {
    // Implementation logic for transforming data to CSV
    // ...utilize data formatting libraries or custom implementation as needed
    return '...'; // Placeholder for CSV conversion logic
  };

  // Query to fetch report data based on criteria
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['generateReport', reportCriteria],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          start_date: reportCriteria.start_date,
          end_date: reportCriteria.end_date,
          user_id: reportCriteria.user_id,
        },
      });
      return transformResponseToCSV(response.data);
    },
    enabled: false, retry: 1, refetchOnWindowFocus: false,
  });

  return (
    <>
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Generate Reports</h2>
          <div className="bg-gray-100 p-4 shadow rounded-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                refetch();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={reportCriteria.start_date}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={reportCriteria.end_date}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <input
                  type="text"
                  id="user_id"
                  name="user_id"
                  value={reportCriteria.user_id}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </form>

            {error && <p className="mt-4 text-red-500 text-sm">An error occurred: {error.message}</p>}

            {data && (
              <div className="mt-4">
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(data)}`}
                  download="report.csv"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Download Report
                </a>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Link to="/admin" className="text-blue-600 hover:text-blue-800 underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ReportGeneration;