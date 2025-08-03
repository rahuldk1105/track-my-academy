import React, { useState } from 'react';
import { API_CONFIG } from '../config/api';

const SuperAdminSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const createSuperAdmin = async () => {
    setIsCreating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/create-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.detail || 'Failed to create super admin');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Super Admin Setup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create the initial super administrator account
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Initialize Super Admin
            </h3>
            
            {!result && !error && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This will create the initial super administrator account with the following credentials:
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-mono">
                    <strong>Email:</strong> superadmin@trackmyacademy.com
                  </p>
                  <p className="text-sm font-mono">
                    <strong>Password:</strong> SuperAdmin123!
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Make sure to change the password after first login!
                  </p>
                </div>
                <button
                  onClick={createSuperAdmin}
                  disabled={isCreating}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                  {isCreating ? 'Creating...' : 'Create Super Admin'}
                </button>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h4 className="text-green-800 font-medium">✅ Success!</h4>
                  <p className="text-green-700 mt-2">{result.message}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium text-gray-900 mb-2">Login Credentials:</h4>
                  <p className="text-sm font-mono mb-1">
                    <strong>Email:</strong> {result.email}
                  </p>
                  <p className="text-sm font-mono mb-1">
                    <strong>Password:</strong> {result.password}
                  </p>
                  <p className="text-sm font-mono">
                    <strong>User ID:</strong> {result.user_id}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-700">
                    {result.instructions || "You can now sign in using the login form."}
                  </p>
                </div>

                <div className="space-y-2">
                  <a
                    href="/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Go to Login Page
                  </a>
                  <button
                    onClick={() => {setResult(null); setError(null);}}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Another Admin
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="text-red-800 font-medium">❌ Error</h4>
                  <p className="text-red-700 mt-2">{error}</p>
                </div>
                <button
                  onClick={() => {setError(null); setResult(null);}}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          <div className="text-center">
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSetup;